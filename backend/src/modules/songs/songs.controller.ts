import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { PublishSongDto } from './dto/publish-song.dto';
import { SongsService } from './songs.service';

@Controller('songs')
export class SongsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly songsService: SongsService,
  ) {}

  @Post('publish')
  async publish(
    @Body() dto: PublishSongDto,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.getOrCreate(authUser);
    return this.songsService.publishSong({
      userId: user.id,
      ...dto,
    });
  }
}
