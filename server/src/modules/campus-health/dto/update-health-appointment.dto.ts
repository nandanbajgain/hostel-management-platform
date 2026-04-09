import { HealthAppointmentStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateHealthAppointmentDto {
  @IsOptional()
  @IsEnum(HealthAppointmentStatus)
  status?: HealthAppointmentStatus;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

