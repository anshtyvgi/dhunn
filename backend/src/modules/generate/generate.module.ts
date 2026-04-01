import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { UsersModule } from '../users/users.module';
import { GeminiService } from '../../providers/gemini/gemini.service';

@Module({
  imports: [UsersModule],
  controllers: [GenerateController],
  providers: [GenerateService, GeminiService],
  exports: [GenerateService],
})
export class GenerateModule {}
