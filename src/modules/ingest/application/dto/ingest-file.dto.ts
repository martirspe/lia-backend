import { IsString, Length, IsOptional } from 'class-validator';

export class IngestFileDto {
  @IsString()
  @Length(10, 50)
  botId!: string;

  @IsString()
  @Length(10, 50)
  fileId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;
}