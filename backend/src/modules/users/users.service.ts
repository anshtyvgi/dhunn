import { Injectable } from '@nestjs/common';
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

  async creditCoins(params: {
    clerkUserId: string;
    amount: number;
    externalRef: string;
    description: string;
    metadata?: Prisma.InputJsonValue;
  }) {
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
