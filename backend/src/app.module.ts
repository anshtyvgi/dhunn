import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import appConfig from './common/config/app.config';
import { validate } from './common/config/validation';
import { AuthModule } from './auth/auth.module';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queues/queue.module';
import { GenerateModule } from './modules/generate/generate.module';
import { SongsModule } from './modules/songs/songs.module';
import { CommunityModule } from './modules/community/community.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { GeminiService } from './providers/gemini/gemini.service';
import { WanService } from './providers/wan/wan.service';
import { R2Service } from './providers/r2/r2.service';
import { OrchestratorProcessor } from './queues/orchestrator/orchestrator.processor';
import { AudioProcessor } from './workers/audio/audio.processor';
import { CoverProcessor } from './workers/cover/cover.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate,
      expandVariables: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('redisUrl'),
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 1000,
          timeout: 600000, // 10 minutes max per job
        },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 5 },
        { name: 'medium', ttl: 10000, limit: 30 },
        { name: 'long', ttl: 60000, limit: 100 },
      ],
    }),
    AuthModule,
    PrismaModule,
    QueueModule,
    UsersModule,
    GenerateModule,
    SongsModule,
    CommunityModule,
    PaymentsModule,
    AdminModule,
  ],
  providers: [
    GeminiService,
    WanService,
    R2Service,
    OrchestratorProcessor,
    AudioProcessor,
    CoverProcessor,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
