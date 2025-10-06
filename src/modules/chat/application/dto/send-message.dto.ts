import { IsString, Length } from 'class-validator';

// Clase DTO para enviar un mensaje en una conversación
export class SendMessageDto {
  @IsString()
  @Length(10, 50)
  conversationId!: string;

  @IsString()
  @Length(1, 8000)
  content!: string;
}