import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class ClerkService {
  constructor(private readonly configService: ConfigService) {}

  async authenticate(authHeader?: string): Promise<AuthenticatedUser> {
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('Missing Clerk bearer token');
    }

    const verified = await verifyToken(token, {
      secretKey: this.configService.getOrThrow<string>('clerkSecretKey'),
    });

    return {
      clerkUserId: verified.sub,
      email: this.readClaim(verified, 'email'),
      firstName: this.readClaim(verified, 'first_name'),
      lastName: this.readClaim(verified, 'last_name'),
      username: this.readClaim(verified, 'username'),
      imageUrl: this.readClaim(verified, 'image_url'),
    };
  }

  private extractBearerToken(authHeader?: string) {
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  private readClaim(
    verified: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = verified[key];
    return typeof value === 'string' ? value : null;
  }
}
