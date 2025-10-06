import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,40}$/)
  slug?: string;
}