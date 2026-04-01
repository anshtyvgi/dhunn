import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Prisma, TransactionType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getOrCreate(authUser: AuthenticatedUser) {
    const reward = this.configService.getOrThrow<{ initialFreeCoins: number }>(
      'pricing',
    ).initialFreeCoins;

    return this.prisma.user.upsert({
      where: { clerkUserId: authUser.clerkUserId },
      update: {
        email: authUser.email ?? undefined,
        firstName: authUser.firstName ?? undefined,
        lastName: authUser.lastName ?? undefined,
        username: authUser.username ?? undefined,
        imageUrl: authUser.imageUrl ?? undefined,
      },
      create: {
        clerkUserId: authUser.clerkUserId,
        email: authUser.email ?? undefined,
        firstName: authUser.firstName ?? undefined,
        lastName: authUser.lastName ?? undefined,
        username: authUser.username ?? undefined,
        imageUrl: authUser.imageUrl ?? undefined,
        coins: reward,
        onboardingRewarded: true,
      },
    });
  }

  private static readonly MAX_AD_UNLOCKS_PER_DAY = 5;

  async useAdUnlock(userId: string): Promise<{ success: boolean; remaining: number }> {
    const today = new Date().toISOString().split('T')[0];

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      const count = user.adUnlockDate === today ? user.adUnlocksToday : 0;
      if (count >= UsersService.MAX_AD_UNLOCKS_PER_DAY) {
        return { success: false, remaining: 0 };
      }

      const newCount = count + 1;
      await tx.user.update({
        where: { id: userId },
        data: { adUnlocksToday: newCount, adUnlockDate: today },
      });

      return {
        success: true,
        remaining: UsersService.MAX_AD_UNLOCKS_PER_DAY - newCount,
      };
    });
  }

  async getAdUnlocksRemaining(userId: string): Promise<number> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = new Date().toISOString().split('T')[0];
    const count = user.adUnlockDate === today ? user.adUnlocksToday : 0;
    return UsersService.MAX_AD_UNLOCKS_PER_DAY - count;
  }

  async getSessionCount(userId: string): Promise<number> {
    return this.prisma.generationSession.count({
      where: { userId },
    });
  }

  async creditCoins(params: {
    clerkUserId: string;
    amount: number;
    externalRef: string;
    description: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new BadRequestException('Coin amount must be a positive integer');
    }
    if (params.amount > 10000) {
      throw new BadRequestException('Coin amount exceeds maximum allowed');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { clerkUserId: params.clerkUserId },
        update: {},
        create: {
          clerkUserId: params.clerkUserId,
          coins: 0,
          onboardingRewarded: false,
        },
      });

      const existing = await tx.transaction.findUnique({
        where: { externalRef: params.externalRef },
      });

      if (existing) {
        return user;
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          coins: {
            increment: params.amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.CREDIT,
          amount: params.amount,
          description: params.description,
          externalRef: params.externalRef,
          metadata: params.metadata,
        },
      });

      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });
  }
}
