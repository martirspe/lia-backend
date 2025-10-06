import { Injectable, Logger } from '@nestjs/common';

// Servicio de facturación (billing) - actualmente no implementado
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  async ensureCustomer(_tenantId: string, _name: string, _email: string): Promise<string | null> {
    this.logger.warn('BillingService.ensureCustomer: not implemented');
    return null;
  }
}