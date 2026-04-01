import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { COVER_QUEUE, JOB_GENERATE_COVER } from '../../queues/queue.constants';
import { GenerateService } from '../../modules/generate/generate.service';
import { GeminiService } from '../../providers/gemini/gemini.service';
import { R2Service } from '../../providers/r2/r2.service';

@Injectable()
@Processor(COVER_QUEUE, { concurrency: 6 })
export class CoverProcessor extends WorkerHost {
  private readonly logger = new Logger(CoverProcessor.name);

  constructor(
    private readonly generateService: GenerateService,
    private readonly geminiService: GeminiService,
    private readonly r2Service: R2Service,
  ) {
    super();
  }

  async process(job: Job<{ songId: string }>) {
    if (job.name !== JOB_GENERATE_COVER) {
      return;
    }

    const song = await this.generateService.getSongWithSession(job.data.songId);
    const sid = song.sessionId; // correlation ID

    if (song.coverImageUrl) {
      this.logger.log(`[session:${sid}] Song ${song.id} already has cover, skipping`);
      return;
    }

    this.logger.log(`[session:${sid}] Starting cover generation for song ${song.id}`);
    await this.generateService.markCoverProcessing(song.id);

    try {
      const generated = await this.geminiService.generateCoverImage({
        title: song.title,
        vibe: song.vibe ?? 'emotional',
        coverPrompt: song.prompt ?? 'Premium album art',
      });

      const extension = generated.mimeType.includes('png') ? 'png' : 'jpg';
      const key = `sessions/${sid}/covers/${song.id}.${extension}`;
      const uploaded = await this.r2Service.uploadBuffer({
        key,
        body: generated.buffer,
        contentType: generated.mimeType,
      });

      this.logger.log(`[session:${sid}] Cover uploaded for song ${song.id}`);
      await this.generateService.markCoverReady({
        songId: song.id,
        coverImageUrl: uploaded.url,
        storageKey: uploaded.key,
      });
    } catch (error) {
      this.logger.error(
        `[session:${sid}] Cover generation failed for song ${song.id}: ${(error as Error).message}`,
      );
      await this.generateService.markCoverFailed(song.id);
      throw error;
    }
  }
}
