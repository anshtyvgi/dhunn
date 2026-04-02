import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { UsersModule } from '../users/users.module';
import { GeminiService } from '../../providers/gemini/gemini.service';
import { R2Service } from '../../providers/r2/r2.service';

@Module({
  imports: [UsersModule],
  controllers: [GenerateController],
  providers: [GenerateService, GeminiService, R2Service],
  exports: [GenerateService],
})
export class GenerateModule {}
