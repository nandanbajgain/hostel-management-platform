import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  @MinLength(3)
  location: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class UpdateMaintenanceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
