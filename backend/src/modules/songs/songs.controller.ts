import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { PublishSongDto } from './dto/publish-song.dto';
import { SongsService } from './songs.service';
import { R2Service } from '../../providers/r2/r2.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('songs')
export class SongsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly songsService: SongsService,
    private readonly r2Service: R2Service,
    private readonly prisma: PrismaService,
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

  /**
   * GET /songs/:id/download — returns a short-lived presigned URL for the audio file.
   * Only the owning user can download.
   */
  @Get(':id/download')
  async download(
    @Param('id') songId: string,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.getOrCreate(authUser);

    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      include: { session: true },
    });

    if (!song || song.session.userId !== user.id) {
      throw new NotFoundException('Song not found');
    }

    if (!song.audioStorageKey) {
      throw new NotFoundException('Audio not yet available');
    }

    const url = await this.r2Service.getPresignedUrl(song.audioStorageKey, 300);

    return { url, expiresIn: 300 };
  }
}
