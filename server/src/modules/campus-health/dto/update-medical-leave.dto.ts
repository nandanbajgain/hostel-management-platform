import { MedicalDocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMedicalLeaveDto {
  @IsOptional()
  @IsEnum(MedicalDocumentStatus)
  status?: MedicalDocumentStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

