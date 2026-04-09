import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CampusHealthService } from './campus-health.service';
import {
  CreateAvailabilityDto,
  CreateHealthAppointmentDto,
  UpdateHealthAppointmentDto,
  UpsertVisitRecordDto,
  CreateMedicineDto,
  UpdateMedicineDto,
  CreateInsuranceClaimDto,
  UpdateInsuranceClaimDto,
  CreateMedicalLeaveDto,
  UpdateMedicalLeaveDto,
} from './dto';
import { Role } from '@prisma/client';

type AuthenticatedRequest = Request & {
  user: { id: string; role: Role; email: string; name: string };
};

@ApiTags('Campus Health')
@ApiBearerAuth()
@Controller('campus-health')
@UseGuards(JwtAuthGuard)
export class CampusHealthController {
  constructor(private readonly service: CampusHealthService) {}

  @Get('doctors')
  async listDoctors() {
    return this.service.listDoctors();
  }

  @Get('doctor/availability')
  @Roles('DOCTOR')
  @UseGuards(RolesGuard)
  async myAvailability(@Req() req: AuthenticatedRequest) {
    return this.service.getDoctorAvailability(req.user.id);
  }

  @Post('doctor/availability')
  @Roles('DOCTOR')
  @UseGuards(RolesGuard)
  async replaceAvailability(
    @Req() req: AuthenticatedRequest,
    @Body() items: CreateAvailabilityDto[],
  ) {
    return this.service.replaceDoctorAvailability(req.user.id, items);
  }

  @Get('slots')
  async getSlots(
    @Query('doctorId') doctorId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getAvailableSlots(doctorId, from, to);
  }

  @Post('appointments')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async createAppointment(@Req() req: AuthenticatedRequest, @Body() dto: CreateHealthAppointmentDto) {
    return this.service.createAppointment(req.user.id, dto);
  }

  @Get('appointments/mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async myAppointments(@Req() req: AuthenticatedRequest) {
    return this.service.listMyAppointments(req.user.id);
  }

  @Get('appointments/doctor')
  @Roles('DOCTOR')
  @UseGuards(RolesGuard)
  async doctorAppointments(@Req() req: AuthenticatedRequest) {
    return this.service.listDoctorAppointments(req.user.id);
  }

  @Patch('appointments/:id')
  @Roles('STUDENT', 'DOCTOR', 'ADMIN')
  @UseGuards(RolesGuard)
  async updateAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateHealthAppointmentDto,
  ) {
    return this.service.updateAppointment(id, req.user.id, req.user.role, dto);
  }

  @Post('appointments/:id/record')
  @Roles('DOCTOR')
  @UseGuards(RolesGuard)
  async upsertRecord(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertVisitRecordDto,
  ) {
    return this.service.upsertVisitRecord(id, req.user.id, dto);
  }

  @Get('medicines')
  @Roles('ADMIN', 'DOCTOR', 'STUDENT')
  @UseGuards(RolesGuard)
  async listMedicines() {
    return this.service.listMedicines();
  }

  @Post('medicines')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async createMedicine(@Body() dto: CreateMedicineDto) {
    return this.service.createMedicine(dto);
  }

  @Patch('medicines/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateMedicine(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.service.updateMedicine(id, dto);
  }

  @Post('prescriptions/:id/dispense')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async dispense(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.dispensePrescription(id, req.user.id);
  }

  @Get('prescriptions/mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async myPrescriptions(@Req() req: AuthenticatedRequest) {
    return this.service.listMyPrescriptions(req.user.id);
  }

  @Post('claims')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async createClaim(@Req() req: AuthenticatedRequest, @Body() dto: CreateInsuranceClaimDto) {
    return this.service.createInsuranceClaim(req.user.id, dto);
  }

  @Get('claims/mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async myClaims(@Req() req: AuthenticatedRequest) {
    return this.service.listMyClaims(req.user.id);
  }

  @Get('claims')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async listClaims() {
    return this.service.listClaims();
  }

  @Patch('claims/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateClaim(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceClaimDto,
  ) {
    return this.service.updateClaim(id, req.user.id, dto);
  }

  @Post('medical-leave')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async createMedicalLeave(@Req() req: AuthenticatedRequest, @Body() dto: CreateMedicalLeaveDto) {
    return this.service.createMedicalLeave(req.user.id, dto);
  }

  @Get('medical-leave/mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async myMedicalLeave(@Req() req: AuthenticatedRequest) {
    return this.service.listMyMedicalLeave(req.user.id);
  }

  @Get('medical-leave')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async listMedicalLeave() {
    return this.service.listMedicalLeaveRequests();
  }

  @Patch('medical-leave/:id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateMedicalLeave(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalLeaveDto,
  ) {
    return this.service.updateMedicalLeave(id, req.user.id, dto);
  }
}
