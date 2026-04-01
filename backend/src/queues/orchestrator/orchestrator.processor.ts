import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { GenerateService } from '../../modules/generate/generate.service';
import { GeminiService } from '../../providers/gemini/gemini.service';
import {
  AUDIO_QUEUE,
  COVER_QUEUE,
  JOB_GENERATE_AUDIO,
  JOB_GENERATE_COVER,
  JOB_START_GENERATION,
  ORCHESTRATOR_QUEUE,
} from '../queue.constants';
import { CreateDedicateDto } from '../../modules/generate/dto/create-dedicate.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
@Processor(ORCHESTRATOR_QUEUE, { concurrency: 5 })
export class OrchestratorProcessor extends WorkerHost {
  private readonly logger = new Logger(OrchestratorProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generateService: GenerateService,
    private readonly geminiService: GeminiService,
    @InjectQueue(AUDIO_QUEUE) private readonly audioQueue: Queue,
    @InjectQueue(COVER_QUEUE) private readonly coverQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ sessionId: string }>) {
    if (job.name !== JOB_START_GENERATION) {
      return;
    }

    const session = await this.prisma.generationSession.findUniqueOrThrow({
      where: { id: job.data.sessionId },
      include: {
        songs: {
          orderBy: { variantIndex: 'asc' },
        },
      },
    });

    if (session.songs.length > 0) {
      await Promise.all([
        this.audioQueue.addBulk(
          session.songs.map((song) => ({
            name: JOB_GENERATE_AUDIO,
            data: { songId: song.id },
            opts: {
              jobId: `audio:${song.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: 1000,
              removeOnFail: 1000,
            },
          })),
        ),
        this.coverQueue.addBulk(
          session.songs.map((song) => ({
            name: JOB_GENERATE_COVER,
            data: { songId: song.id },
            opts: {
              jobId: `cover:${song.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 4000 },
              removeOnComplete: 1000,
              removeOnFail: 1000,
            },
          })),
        ),
      ]);
      return;
    }

    await this.generateService.markPromptProcessing(session.id);

    try {
      const input = session.input as unknown as CreateDedicateDto;
      const generated = input.lyricOptions?.length === 3
        ? {
            globalTags: Array.from(
              new Set(input.lyricOptions.flatMap((variant) => variant.tags)),
            ),
            variants: this.geminiService.normalizePreviewOptions(
              input.lyricOptions,
            ),
          }
        : await this.geminiService.generateLyricVariants(input);

      const songs = await this.generateService.seedVariants({
        sessionId: session.id,
        prompt: {
          source: 'gemini',
          generatedAt: new Date().toISOString(),
          globalTags: generated.globalTags,
        },
        tags: generated.globalTags,
        variants: generated.variants,
      });

      await Promise.all([
        this.audioQueue.addBulk(
          songs.map((song) => ({
            name: JOB_GENERATE_AUDIO,
            data: { songId: song.id },
            opts: {
              jobId: `audio:${song.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: 1000,
              removeOnFail: 1000,
            },
          })),
        ),
        this.coverQueue.addBulk(
          songs.map((song) => ({
            name: JOB_GENERATE_COVER,
            data: { songId: song.id },
            opts: {
              jobId: `cover:${song.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 4000 },
              removeOnComplete: 1000,
              removeOnFail: 1000,
            },
          })),
        ),
      ]);
    } catch (error) {
      this.logger.error(
        `Failed to orchestrate session ${session.id}: ${(error as Error).message}`,
      );
      await this.generateService.markOrchestratorFailed(
        session.id,
        (error as Error).message,
      );
      throw error;
    }
  }
}
