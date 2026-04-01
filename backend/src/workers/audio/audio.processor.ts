import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { AUDIO_QUEUE, JOB_GENERATE_AUDIO } from '../../queues/queue.constants';
import { GenerateService } from '../../modules/generate/generate.service';
import { WanService } from '../../providers/wan/wan.service';
import { R2Service } from '../../providers/r2/r2.service';

@Injectable()
@Processor(AUDIO_QUEUE, { concurrency: 1 })
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    private readonly generateService: GenerateService,
    private readonly wanService: WanService,
    private readonly r2Service: R2Service,
  ) {
    super();
  }

  async process(job: Job<{ songId: string }>) {
    if (job.name !== JOB_GENERATE_AUDIO) {
      return;
    }

    const song = await this.generateService.getSongWithSession(job.data.songId);
    const sid = song.sessionId; // correlation ID

    if (song.audioUrl) {
      this.logger.log(`[session:${sid}] Song ${song.id} already has audio, skipping`);
      return;
    }

    this.logger.log(`[session:${sid}] Starting audio generation for song ${song.id}`);
    await this.generateService.markAudioProcessing(song.id);

    try {
      const generated = await this.wanService.generateAudio({
        lyrics: song.lyrics,
        tags: song.tags,
      });

      this.logger.log(`[session:${sid}] WAN task ${generated.taskId} completed for song ${song.id}`);
      await this.generateService.markAudioProcessing(song.id, generated.taskId);

      const key = `sessions/${sid}/songs/${song.id}.mp3`;
      const uploaded = await this.r2Service.uploadBuffer({
        key,
        body: generated.buffer,
        contentType: generated.mimeType,
      });

      this.logger.log(`[session:${sid}] Audio uploaded for song ${song.id}`);
      await this.generateService.markAudioReady({
        songId: song.id,
        audioUrl: uploaded.url,
        storageKey: uploaded.key,
      });
    } catch (error) {
      this.logger.error(
        `[session:${sid}] Audio generation failed for song ${song.id}: ${(error as Error).message}`,
      );
      await this.generateService.markAudioFailed(
        song.id,
        (error as Error).message,
      );
      throw error;
    }
  }
}
