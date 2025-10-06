import { IsUrl } from 'class-validator';

// Clase que define el DTO para la sesión del portal de facturación
export class PortalSessionDto {
  @IsUrl()
  returnUrl!: string;
}