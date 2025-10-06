import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFilesDto {
  @IsOptional()
  @IsString()
  @Length(10, 50)
  botId?: string;

  @IsOptional()
  @IsIn(['stored', 'processing', 'ready', 'error'])
  status?: 'stored' | 'processing' | 'ready' | 'error';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  q?: string;
}