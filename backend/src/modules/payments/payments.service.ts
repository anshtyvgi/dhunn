import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';

interface PaymentWebhookPayload {
  type: string;
  data: {
    paymentId: string;
    clerkUserId: string;
    coins: number;
    amount: number;
    currency: string;
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    this.verifySignature(rawBody, signature);

    const payload = JSON.parse(rawBody.toString('utf8')) as PaymentWebhookPayload;
    if (payload.type !== 'payment.captured') {
      return { accepted: true };
    }

    const updatedUser = await this.usersService.creditCoins({
      clerkUserId: payload.data.clerkUserId,
      amount: payload.data.coins,
      externalRef: `payment:${payload.data.paymentId}`,
      description: `Coin purchase ${payload.data.paymentId}`,
      metadata: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
    });

    return {
      accepted: true,
      userId: updatedUser.id,
      coins: updatedUser.coins,
    };
  }

  private verifySignature(rawBody: Buffer, signature?: string) {
    if (!signature) {
      throw new BadRequestException('Missing payment signature');
    }

    const secret = this.configService.getOrThrow<string>('paymentsWebhookSecret');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new BadRequestException('Invalid payment signature');
    }
  }
}
