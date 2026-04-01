import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateDedicateDto } from './dto/create-dedicate.dto';
import { GenerateService } from './generate.service';
import { UsersService } from '../users/users.service';

@Controller('generate')
export class GenerateController {
  constructor(
    private readonly generateService: GenerateService,
    private readonly usersService: UsersService,
  ) {}

  @Post('dedicate')
  async dedicate(
    @Body() dto: CreateDedicateDto,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    return this.generateService.createDedicateSession(dto, authUser);
  }

  @Post('lyrics-preview')
  async previewLyrics(@Body() dto: CreateDedicateDto) {
    return this.generateService.previewLyrics(dto);
  }

  @Get('session/:id')
  async getSession(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    const user = await this.usersService.getOrCreate(authUser);
    return this.generateService.getSessionForUser(id, user.id);
  }
}
