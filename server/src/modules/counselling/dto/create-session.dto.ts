import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Mood } from '@prisma/client';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;
}
