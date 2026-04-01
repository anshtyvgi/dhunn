import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  AUDIO_QUEUE,
  COVER_QUEUE,
  ORCHESTRATOR_QUEUE,
} from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: ORCHESTRATOR_QUEUE },
      { name: AUDIO_QUEUE },
      { name: COVER_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
