import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMedicalLeaveDto {
  @IsISO8601()
  fromDate!: string;

  @IsISO8601()
  toDate!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;
}

