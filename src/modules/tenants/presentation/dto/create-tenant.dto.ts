import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]{3,40}$/)
  slug!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(6)
  ownerPassword!: string;

  @IsOptional()
  @IsString()
  plan?: string;
}