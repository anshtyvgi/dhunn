import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.getOrCreate(authUser);
    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      coins: user.coins,
    };
  }
}
