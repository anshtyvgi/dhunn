import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  AssetStatus,
  Prisma,
  SessionStatus,
  SessionType,
  SongStatus,
  TransactionType,
} from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateDedicateDto } from './dto/create-dedicate.dto';
import {
  JOB_START_GENERATION,
  ORCHESTRATOR_QUEUE,
} from '../../queues/queue.constants';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../providers/gemini/gemini.service';
import { R2Service } from '../../providers/r2/r2.service';

@Injectable()
export class GenerateService {
  private readonly readySongStatuses = new Set<SongStatus>([
    SongStatus.READY,
    SongStatus.PUBLISHED,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
    private readonly r2Service: R2Service,
    @InjectQueue(ORCHESTRATOR_QUEUE)
    private readonly orchestratorQueue: Queue,
  ) {}

  async previewLyrics(dto: CreateDedicateDto) {
    const options = await this.geminiService.generateLyricPreview(dto);

    // Generate a poster in the background — don't block lyrics response
    let posterUrl: string | null = null;
    try {
      const firstOption = options[0];
      if (firstOption) {
        const image = await this.geminiService.generateCoverImage({
          title: firstOption.title,
          vibe: firstOption.vibe,
          coverPrompt:
            firstOption.coverPrompt ??
            `Premium album art for "${firstOption.title}" with a ${firstOption.vibe} mood.`,
        });
        const ext = image.mimeType.includes('png') ? 'png' : 'jpg';
        const key = `posters/${Date.now()}.${ext}`;
        const uploaded = await this.r2Service.uploadBuffer({
          key,
          body: image.buffer,
          contentType: image.mimeType,
        });
        posterUrl = uploaded.url;
      }
    } catch (err) {
      // Poster failure shouldn't block lyrics
      console.error('Poster generation failed (non-blocking):', (err as Error).message);
    }

    return {
      status: 'lyrics-ready' as const,
      options,
      posterUrl,
    };
  }

  async createDedicateSession(
    dto: CreateDedicateDto,
    authUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.getOrCreate(authUser);
    const baseCost = this.configService.getOrThrow<{
      dedicateGenerationCost: number;
    }>('pricing').dedicateGenerationCost;

    const session = await this.prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
      });

      // TODO: re-enable coin checks when credits system is ready
      const coinCost = 0;

      const created = await tx.generationSession.create({
        data: {
          userId: user.id,
          type: SessionType.DEDICATE,
          status: SessionStatus.QUEUED,
          coinCost,
          input: JSON.parse(
            JSON.stringify(dto),
          ) as Prisma.InputJsonValue,
        },
      });

      if (coinCost > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            coins: {
              decrement: coinCost,
            },
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            sessionId: created.id,
            amount: -coinCost,
            type: TransactionType.DEBIT,
            description: 'Dedicate generation charge',
            metadata: JSON.parse(
              JSON.stringify({
                sessionType: SessionType.DEDICATE,
              }),
            ) as Prisma.InputJsonValue,
          },
        });
      }

      return created;
    });

    await this.orchestratorQueue.add(
      JOB_START_GENERATION,
      { sessionId: session.id },
      {
        jobId: `start_${session.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 4000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );

    return this.getSessionForUser(session.id, user.id);
  }

  async listSessionsForUser(userId: string) {
    const sessions = await this.prisma.generationSession.findMany({
      where: { userId },
      include: {
        songs: { orderBy: { variantIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return sessions.map((session) => ({
      id: session.id,
      status: session.status,
      type: session.type,
      input: session.input,
      coinCost: session.coinCost,
      failedReason: session.failedReason,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      variants: session.songs.map((song) => ({
        id: song.id,
        variantIndex: song.variantIndex,
        title: song.title,
        vibe: song.vibe,
        lyrics: song.lyrics,
        audioStatus: song.status,
        coverStatus: song.coverStatus,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
      })),
    }));
  }

  async getSessionForUser(sessionId: string, userId: string) {
    const session = await this.prisma.generationSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        songs: {
          orderBy: { variantIndex: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Generation session not found');
    }

    return {
      id: session.id,
      status: session.status,
      type: session.type,
      tags: session.tags,
      coinCost: session.coinCost,
      failedReason: session.failedReason,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      completedAt: session.completedAt,
      progress: {
        readyCovers: session.songs.filter(
          (song) => song.coverStatus === AssetStatus.READY,
        ).length,
        readyAudio: session.songs.filter((song) => this.isReadySong(song.status))
          .length,
        totalVariants: session.songs.length,
      },
      variants: session.songs.map((song) => ({
        id: song.id,
        variantIndex: song.variantIndex,
        title: song.title,
        vibe: song.vibe,
        lyrics: song.lyrics,
        tags: song.tags,
        audioStatus: song.status,
        coverStatus: song.coverStatus,
        audioUrl: song.audioUrl,
        coverImageUrl: song.coverImageUrl,
        publishedAt: song.publishedAt,
      })),
    };
  }

  async markPromptProcessing(sessionId: string) {
    await this.prisma.generationSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.PROCESSING_PROMPT,
      },
    });
  }

  async seedVariants(params: {
    sessionId: string;
    prompt: Record<string, unknown>;
    tags: string[];
    variants: Array<{
      variantIndex: number;
      title: string;
      vibe: string;
      lyrics: string;
      tags: string[];
      coverPrompt: string;
    }>;
  }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.generationSession.update({
        where: { id: params.sessionId },
        data: {
          status: SessionStatus.PROCESSING_ASSETS,
          prompt: JSON.parse(
            JSON.stringify(params.prompt),
          ) as Prisma.InputJsonValue,
          tags: params.tags,
        },
      });

      await tx.song.createMany({
        data: params.variants.map((variant) => ({
          sessionId: params.sessionId,
          variantIndex: variant.variantIndex,
          title: variant.title,
          vibe: variant.vibe,
          lyrics: variant.lyrics,
          tags: variant.tags,
          prompt: variant.coverPrompt,
          status: SongStatus.PENDING,
          coverStatus: AssetStatus.PENDING,
        })),
      });
    });

    return this.prisma.song.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { variantIndex: 'asc' },
    });
  }

  async markOrchestratorFailed(sessionId: string, reason: string) {
    const session = await this.prisma.generationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Generation session not found');
    }

    await this.prisma.generationSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.FAILED,
        failedReason: reason.slice(0, 500),
      },
    });

    await this.refundSession(sessionId);
  }

  async markAudioProcessing(songId: string, wanTaskId?: string) {
    await this.prisma.song.update({
      where: { id: songId },
      data: {
        status: SongStatus.PROCESSING,
        wanTaskId,
      },
    });
  }

  async markAudioReady(params: {
    songId: string;
    audioUrl: string;
    storageKey: string;
    durationSeconds?: number;
  }) {
    const song = await this.prisma.song.update({
      where: { id: params.songId },
      data: {
        status: SongStatus.READY,
        audioUrl: params.audioUrl,
        audioStorageKey: params.storageKey,
        durationSeconds: params.durationSeconds,
      },
    });

    await this.refreshSessionStatus(song.sessionId);
  }

  async markAudioFailed(songId: string, reason: string) {
    const song = await this.prisma.song.update({
      where: { id: songId },
      data: {
        status: SongStatus.FAILED,
      },
    });

    await this.refreshSessionStatus(song.sessionId, reason);
  }

  async markCoverProcessing(songId: string) {
    await this.prisma.song.update({
      where: { id: songId },
      data: {
        coverStatus: AssetStatus.PROCESSING,
      },
    });
  }

  async markCoverReady(params: {
    songId: string;
    coverImageUrl: string;
    storageKey: string;
  }) {
    const song = await this.prisma.song.update({
      where: { id: params.songId },
      data: {
        coverStatus: AssetStatus.READY,
        coverImageUrl: params.coverImageUrl,
        coverStorageKey: params.storageKey,
      },
    });

    await this.refreshSessionStatus(song.sessionId);
  }

  async markCoverFailed(songId: string) {
    const song = await this.prisma.song.update({
      where: { id: songId },
      data: {
        coverStatus: AssetStatus.FAILED,
      },
    });

    await this.refreshSessionStatus(song.sessionId);
  }

  async getSongWithSession(songId: string) {
    return this.prisma.song.findUniqueOrThrow({
      where: { id: songId },
      include: {
        session: true,
      },
    });
  }

  async refundSession(sessionId: string) {
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.generationSession.findUniqueOrThrow({
        where: { id: sessionId },
      });

      if (session.refundedAt) {
        return;
      }

      await tx.user.update({
        where: { id: session.userId },
        data: {
          coins: {
            increment: session.coinCost,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: session.userId,
          sessionId: session.id,
          amount: session.coinCost,
          type: TransactionType.REFUND,
          description: 'Automatic refund for failed generation',
          externalRef: `refund:${session.id}`,
        },
      });

      await tx.generationSession.update({
        where: { id: sessionId },
        data: {
          refundedAt: new Date(),
        },
      });
    });
  }

  private async refreshSessionStatus(sessionId: string, failedReason?: string) {
    // Use a transaction for atomic read-compute-write to prevent race conditions
    // between concurrent workers updating the same session
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.generationSession.findUnique({
        where: { id: sessionId },
        include: { songs: true },
      });

      if (!session) {
        return;
      }

      // Don't overwrite terminal states
      if (
        session.status === SessionStatus.COMPLETED ||
        session.status === SessionStatus.FAILED
      ) {
        return;
      }

      const totalSongs = session.songs.length;
      const readyAudio = session.songs.filter((song) =>
        this.isReadySong(song.status),
      ).length;
      const failedAudio = session.songs.filter(
        (song) => song.status === SongStatus.FAILED,
      ).length;
      const readyCovers = session.songs.filter(
        (song) => song.coverStatus === AssetStatus.READY,
      ).length;

      let status: SessionStatus = SessionStatus.PROCESSING_ASSETS;
      let completedAt: Date | null = null;
      let failedReasonValue: string | undefined;

      if (totalSongs > 0 && readyAudio === totalSongs) {
        status = SessionStatus.COMPLETED;
        completedAt = new Date();
      } else if (
        totalSongs > 0 &&
        readyAudio > 0 &&
        readyAudio + failedAudio === totalSongs
      ) {
        status = SessionStatus.COMPLETED;
        completedAt = new Date();
        failedReasonValue = failedReason;
      } else if (totalSongs > 0 && readyAudio === 0 && failedAudio === totalSongs) {
        status = SessionStatus.FAILED;
        failedReasonValue = failedReason ?? 'All audio variants failed';
      } else if (readyCovers > 0 || readyAudio > 0) {
        status = SessionStatus.PARTIAL;
      }

      await tx.generationSession.update({
        where: { id: sessionId },
        data: {
          status,
          completedAt: completedAt ?? undefined,
          failedReason: failedReasonValue,
        },
      });

      if (status === SessionStatus.FAILED) {
        // Inline refund within the same transaction to prevent double-refund race
        if (!session.refundedAt) {
          await tx.user.update({
            where: { id: session.userId },
            data: { coins: { increment: session.coinCost } },
          });
          await tx.transaction.create({
            data: {
              userId: session.userId,
              sessionId: session.id,
              amount: session.coinCost,
              type: TransactionType.REFUND,
              description: 'Automatic refund for failed generation',
              externalRef: `refund:${session.id}`,
            },
          });
          await tx.generationSession.update({
            where: { id: sessionId },
            data: { refundedAt: new Date() },
          });
        }
      }
    });
  }

  private isReadySong(status: SongStatus) {
    return this.readySongStatuses.has(status);
  }
}
