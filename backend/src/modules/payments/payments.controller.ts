import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('x-payment-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(
      request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {})),
      signature,
    );
  }
}
