import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateHealthAppointmentDto {
  @IsString()
  doctorId!: string;

  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

