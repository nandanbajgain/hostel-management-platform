import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
