import { IsOptional, IsString, Length, IsInt, Max, Min } from 'class-validator';

// Clase DTO para obtener mensajes de una conversación
export class GetMessagesDto {
  @IsString()
  @Length(10, 50)
  conversationId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  take?: number = 50;
}