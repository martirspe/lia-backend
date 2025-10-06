import { IsString, MinLength } from 'class-validator';

// Clase que define el DTO para el refresh token
export class RefreshDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}