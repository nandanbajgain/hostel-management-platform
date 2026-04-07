import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CloseSessionDto {
  @IsOptional()
  @IsString()
  sessionNotes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
