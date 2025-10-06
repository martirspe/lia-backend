import { IsEmail, IsString, MinLength } from 'class-validator';

// Clase que define el DTO para el login
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}