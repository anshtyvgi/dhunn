import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Public()
  @Get('feed')
  async feed(@Query('limit') limit?: string) {
    return this.communityService.getFeed(limit ? parseInt(limit, 10) : 20);
  }
}
