import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(180)
  durationMins?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}

