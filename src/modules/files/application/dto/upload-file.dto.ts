import { IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @Length(10, 50)
  botId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    return Boolean(value);
  })
  ingest?: boolean;
}