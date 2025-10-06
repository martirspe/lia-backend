import { IsString, Length, IsOptional } from 'class-validator';

export class IngestApiDto {
  @IsString()
  @Length(10, 50)
  botId!: string;

  @IsString()
  @Length(1, 20000)
  content!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  source?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;
}