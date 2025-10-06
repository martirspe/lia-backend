import { IsOptional, IsString, Length } from 'class-validator';

// Clase DTO para crear una conversación
export class CreateConversationDto {
  @IsString()
  @Length(10, 50)
  botId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;
}