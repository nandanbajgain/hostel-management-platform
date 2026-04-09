import { Mood } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateJournalEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

