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
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnonymousService } from './anonymous.service';
import { ComplaintsService } from './complaints.service';
import {
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/create-complaint.dto';

type AuthenticatedRequest = Request & {
  user: { id: string; role: string; email: string; name: string };
};

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly anonymousService: AnonymousService,
  ) {}

  @Get('track/:token')
  trackPublic(@Param('token') token: string) {
    return this.anonymousService.publicTrack(token);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(req.user.id, dto);
  }

  @Post('anonymous')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  submitAnonymous(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.anonymousService.submit(dto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  findAll(
    @Query('status') status?: ComplaintStatus,
    @Query('category') category?: ComplaintCategory,
  ) {
    return this.complaintsService.findAll(status, category);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthenticatedRequest) {
    return this.complaintsService.findMyComplaints(req.user.id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateComplaintStatusDto) {
    return this.complaintsService.updateStatus(id, dto);
  }
}
