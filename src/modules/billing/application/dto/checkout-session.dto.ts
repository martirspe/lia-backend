import { IsString, IsUrl } from 'class-validator';

// Clase que define el DTO para la sesión de checkout
export class CheckoutSessionDto {
  @IsString()
  priceId!: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}