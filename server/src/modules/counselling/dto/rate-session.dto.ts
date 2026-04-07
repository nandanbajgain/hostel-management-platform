import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class RateSessionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  ratingComment?: string;
}
