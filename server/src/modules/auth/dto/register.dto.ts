import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUrl,
  IsString,
  Matches,
  MaxLength,
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

  @IsEnum(Gender)
  gender: Gender;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sportsInterests: string[];

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
