import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER'])
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}