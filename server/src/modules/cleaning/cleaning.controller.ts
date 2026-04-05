import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateCleaningAssignmentsDto,
  CreateCleaningStaffDto,
  SubmitCleaningFeedbackDto,
  UpdateCleaningStaffDto,
} from './dto/cleaning.dto';
import { CleaningService } from './cleaning.service';
import { CleaningAssignmentStatus } from '@prisma/client';

@ApiTags('Cleaning')
@ApiBearerAuth()
@Controller('cleaning')
@UseGuards(JwtAuthGuard)
export class CleaningController {
  constructor(private readonly cleaning: CleaningService) {}

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  listStaff() {
    return this.cleaning.listStaff();
  }

  @Post('staff')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  createStaff(@Body() dto: CreateCleaningStaffDto) {
    return this.cleaning.createStaff(dto);
  }

  @Patch('staff')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  updateStaff(@Body() body: { id: string } & UpdateCleaningStaffDto) {
    return this.cleaning.updateStaff(body.id, body);
  }

  @Post('assignments')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  createAssignments(@Body() dto: CreateCleaningAssignmentsDto) {
    return this.cleaning.createAssignments(dto);
  }

  @Get('assignments')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  listAssignments(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('roomId') roomId?: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: CleaningAssignmentStatus,
  ) {
    return this.cleaning.listAssignments({ from, to, roomId, staffId, status });
  }

  @Get('admin/compliance')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  compliance(@Query('days') days?: string) {
    const parsed = days ? Number.parseInt(days, 10) : undefined;
    return this.cleaning.adminComplianceSummary({ days: parsed });
  }

  @Get('my/upcoming')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  myUpcoming(@Req() req: { user: { id: string } }) {
    return this.cleaning.myUpcoming(req.user.id);
  }

  @Post('feedback')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  feedback(@Req() req: { user: { id: string } }, @Body() dto: SubmitCleaningFeedbackDto) {
    return this.cleaning.submitFeedback(req.user.id, dto);
  }
}

