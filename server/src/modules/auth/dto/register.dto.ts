import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
  import { Gender, Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsUrl({ require_protocol: true })
  avatarUrl: string;

  @IsString()
  enrollmentNo: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  course: string;

  @IsString()
  coursePreference: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sportsInterests: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  hobbies: string[];

  @IsString()
  sleepSchedule: string;

  @IsString()
  noiseTolerance: string;

  @IsInt()
  @Min(1)
  @Max(16)
  studyHours: number;

  @IsInt()
  @Min(3)
  @Max(12)
  sleepHours: number;

  @IsString()
  careerGoal: string;

  @IsString()
  @MinLength(10)
  @MaxLength(250)
  address: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Parent contact number must be a valid E.164 number (10-15 digits)',
  })
  parentContactNo: string;
}
