import { Global, Module } from '@nestjs/common';
import { ClerkService } from '../providers/clerk/clerk.service';

@Global()
@Module({
  providers: [ClerkService],
  exports: [ClerkService],
})
export class AuthModule {}
