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
    const sid = song.sessionId;

    if (song.audioUrl) {
      this.logger.log(`[session:${sid}] Song ${song.id} already has audio, skipping`);
      return;
    }

    this.logger.log(
      `[session:${sid}] Starting audio generation for song ${song.id} (attempt ${job.attemptsMade + 1}/${(job.opts?.attempts ?? 3) + 1})`,
    );
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
      const message = (error as Error).message ?? String(error);
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts?.attempts ?? 3);
      const isRetryable = message.includes('429') || message.includes('timeout') || message.includes('ECONNREFUSED');

      if (isRetryable && !isLastAttempt) {
        // Don't mark as FAILED — BullMQ will retry this job
        this.logger.warn(
          `[session:${sid}] Retryable error for song ${song.id} (attempt ${job.attemptsMade + 1}): ${message}`,
        );
      } else {
        // Final attempt or non-retryable error — mark as permanently failed
        this.logger.error(
          `[session:${sid}] Audio generation failed for song ${song.id}: ${message}`,
        );
        await this.generateService.markAudioFailed(song.id, message);
      }
      throw error;
    }
  }
}
