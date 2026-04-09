import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateInsuranceClaimDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  billUrl?: string;
}

