import { IsString, IsUrl, IsOptional, Length } from 'class-validator';

export class IngestUrlDto {
  @IsString()
  @Length(10, 50)
  botId!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;
}