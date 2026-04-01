import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { AUDIO_QUEUE, JOB_GENERATE_AUDIO } from '../../queues/queue.constants';
import { GenerateService } from '../../modules/generate/generate.service';
import { WanService } from '../../providers/wan/wan.service';
import { R2Service } from '../../providers/r2/r2.service';

@Injectable()
@Processor(AUDIO_QUEUE, { concurrency: 6 })
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

    if (song.audioUrl) {
      return;
    }

    await this.generateService.markAudioProcessing(song.id);

    try {
      const generated = await this.wanService.generateAudio({
        lyrics: song.lyrics,
        tags: song.tags,
      });

      await this.generateService.markAudioProcessing(song.id, generated.taskId);

      const key = `sessions/${song.sessionId}/songs/${song.id}.mp3`;
      const uploaded = await this.r2Service.uploadBuffer({
        key,
        body: generated.buffer,
        contentType: generated.mimeType,
      });

      await this.generateService.markAudioReady({
        songId: song.id,
        audioUrl: uploaded.url,
        storageKey: uploaded.key,
      });
    } catch (error) {
      this.logger.error(
        `Audio generation failed for song ${song.id}: ${(error as Error).message}`,
      );
      await this.generateService.markAudioFailed(
        song.id,
        (error as Error).message,
      );
      throw error;
    }
  }
}
