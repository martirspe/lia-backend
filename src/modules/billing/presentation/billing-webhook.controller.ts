import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { HandleStripeWebhookUseCase } from '../application/use-cases/handle-stripe-webhook.usecase';

@Controller('billing')
export class BillingWebhookController {
  constructor(private readonly handleWebhookUC: HandleStripeWebhookUseCase) { }

  // Nota: para verificar firma en Fastify se recomienda fastify-raw-body.
  // En modo dev, si no hay STRIPE_WEBHOOK_SECRET, se acepta JSON sin verificar.
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: FastifyRequest,
    @Headers('stripe-signature') signature?: string,
    @Body() body?: unknown,
  ) {
    const raw = (req as any).rawBody || (typeof body === 'string' ? body : JSON.stringify(body || {}));
    return this.handleWebhookUC.execute({ signature, rawBody: raw });
  }
}