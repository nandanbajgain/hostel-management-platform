import { InsuranceClaimStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInsuranceClaimDto {
  @IsOptional()
  @IsEnum(InsuranceClaimStatus)
  status?: InsuranceClaimStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

