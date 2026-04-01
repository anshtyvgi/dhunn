import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SessionType,
  ShareStatus,
  ShareVisibility,
  SongStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SongsService {
  private readonly publishableStatuses = new Set<SongStatus>([
    SongStatus.READY,
    SongStatus.PUBLISHED,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async publishSong(params: {
    userId: string;
    songId: string;
    title?: string;
    description?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const song = await tx.song.findUnique({
        where: { id: params.songId },
        include: {
          session: true,
          shares: true,
        },
      });

      if (!song || song.session.userId !== params.userId) {
        throw new NotFoundException('Song not found');
      }

      if (song.session.type === SessionType.DEDICATE) {
        throw new ForbiddenException('Dedicate songs are always private');
      }

      if (!this.publishableStatuses.has(song.status)) {
        throw new ForbiddenException('Only ready studio songs can be published');
      }

      const share =
        song.shares[0] ??
        (await tx.share.create({
          data: {
            songId: song.id,
            ownerId: params.userId,
            slug: randomUUID(),
            previewSecs: 10,
            visibility: ShareVisibility.PUBLIC_PREVIEW,
            status: ShareStatus.ACTIVE,
          },
        }));

      await tx.song.update({
        where: { id: song.id },
        data: {
          status: SongStatus.PUBLISHED,
          publishedAt: song.publishedAt ?? new Date(),
        },
      });

      return tx.share.update({
        where: { id: share.id },
        data: {
          title: params.title ?? song.title,
          description: params.description,
          visibility: ShareVisibility.PUBLIC_PREVIEW,
          status: ShareStatus.ACTIVE,
        },
        include: {
          song: true,
        },
      });
    });
  }
}
