import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateMedicineDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stockQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  lowStockThreshold?: number;
}

