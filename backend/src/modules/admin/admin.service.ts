import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalSongs,
      totalRevenue,
      totalCoinsSpent,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.song.count(),
      this.prisma.transaction.aggregate({
        where: { type: 'CREDIT' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'DEBIT' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    const failedSessions = await this.prisma.generationSession.count({
      where: { status: 'FAILED' },
    });
    const queuedSessions = await this.prisma.generationSession.count({
      where: { status: { in: ['QUEUED', 'PROCESSING_PROMPT', 'PROCESSING_ASSETS'] } },
    });

    return {
      totalUsers,
      totalSongs,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalCoinsSpent: Math.abs(totalCoinsSpent._sum.amount ?? 0),
      failedJobs: failedSessions,
      queuedJobs: queuedSessions,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') || t.user.email,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    };
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sessions: true, transactions: true } },
      },
    });

    return users.map((u) => ({
      id: u.id,
      clerkUserId: u.clerkUserId,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || 'Unknown',
      email: u.email,
      coins: u.coins,
      totalGenerated: u._count.sessions,
      totalTransactions: u._count.transactions,
      createdAt: u.createdAt,
    }));
  }

  async getSessions(limit = 20) {
    return this.prisma.generationSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        songs: { select: { id: true, status: true, title: true } },
      },
    });
  }

  async getTransactions(limit = 50) {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }
}
