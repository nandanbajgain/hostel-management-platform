import { Mood } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateJournalEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

