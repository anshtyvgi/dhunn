import { Injectable } from '@nestjs/common';
import { ShareStatus, ShareVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(limit = 20) {
    const shares = await this.prisma.share.findMany({
      where: {
        status: ShareStatus.ACTIVE,
        visibility: {
          in: [ShareVisibility.PUBLIC_PREVIEW, ShareVisibility.PUBLIC_UNLOCKED],
        },
      },
      include: {
        song: {
          include: {
            session: true,
          },
        },
        owner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });

    return {
      items: shares.map((share) => ({
        id: share.id,
        slug: share.slug,
        title: share.title ?? share.song.title,
        description: share.description,
        visibility: share.visibility,
        previewSecs: share.previewSecs,
        coverImageUrl: share.song.coverImageUrl,
        audioUrl: share.song.audioUrl,
        owner: {
          username: share.owner.username,
          imageUrl: share.owner.imageUrl,
        },
        createdAt: share.createdAt,
      })),
    };
  }
}
