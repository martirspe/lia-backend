import { IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsString()
  planId!: string;
}