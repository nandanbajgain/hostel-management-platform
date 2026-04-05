import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCleaningStaffDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  zone?: string;
}

export class UpdateCleaningStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCleaningAssignmentsDto {
  @IsString()
  staffId: string;

  @IsArray()
  @ArrayNotEmpty()
  roomIds: string[];

  @IsDateString()
  scheduledStart: string;

  @IsDateString()
  scheduledEnd: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitCleaningFeedbackDto {
  @IsString()
  assignmentId: string;

  @IsBoolean()
  cleaned: boolean;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

