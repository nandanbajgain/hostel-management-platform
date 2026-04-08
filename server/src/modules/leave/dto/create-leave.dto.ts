import { IsEnum, IsString, IsNotEmpty, IsDateString, Matches } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Parent contact must be 10 digits' })
  parentContact: string;
}
