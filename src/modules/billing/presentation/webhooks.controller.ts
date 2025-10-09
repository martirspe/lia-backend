import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ProcessWebhookUseCase } from '../application/use-cases/process-webhook.usecase';
import { BillingProvider } from '@prisma/client';

@Controller('billing/webhook')
export class BillingWebhooksController {
  constructor(private readonly processUC: ProcessWebhookUseCase) { }

  @Post('paypal')
  async paypal(@Req() req: RawBodyRequest<Request>, @Headers() headers: Record<string, any>) {
    const rawBody = (req as any).rawBody?.toString?.() || (req as any).bodyRaw || '';
    return this.processUC.execute({
      provider: BillingProvider.PAYPAL,
      rawBody,
      headers,
    });
  }
}