import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';

export class CreateComplaintDto {
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  description: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @IsString()
  @IsOptional()
  adminNote?: string;
}
