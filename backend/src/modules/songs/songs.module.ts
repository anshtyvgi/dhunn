import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { UsersModule } from '../users/users.module';
import { R2Service } from '../../providers/r2/r2.service';

@Module({
  imports: [UsersModule],
  controllers: [SongsController],
  providers: [SongsService, R2Service],
  exports: [SongsService],
})
export class SongsModule {}
