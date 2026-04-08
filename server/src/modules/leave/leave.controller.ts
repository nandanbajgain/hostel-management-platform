import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import type { Request } from 'express';

@ApiTags('Leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async applyLeave(@Body() dto: CreateLeaveDto, @Req() req: any) {
    return this.leaveService.applyLeave(req.user.sub, dto);
  }

  @Get('mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async getMyLeaves(@Req() req: any) {
    return this.leaveService.getMyLeaves(req.user.sub);
  }

  @Get()
  @Roles('WARDEN', 'ADMIN')
  @UseGuards(RolesGuard)
  async getAllLeaves(
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.leaveService.getAllLeaves({
      status: status as any,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('statistics')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getStatistics() {
    return this.leaveService.getLeaveStatistics();
  }

  @Get(':id')
  @Roles('WARDEN', 'ADMIN', 'STUDENT')
  @UseGuards(RolesGuard)
  async getLeaveById(@Param('id') id: string) {
    return this.leaveService.getLeaveById(id);
  }

  @Patch(':id/status')
  @Roles('WARDEN', 'ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(200)
  async updateLeaveStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
    @Req() req: any,
  ) {
    return this.leaveService.updateLeaveStatus(id, dto, req.user.role);
  }

  @Delete(':id/cancel')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  @HttpCode(200)
  async cancelLeave(@Param('id') id: string, @Req() req: any) {
    return this.leaveService.cancelLeave(id, req.user.sub);
  }
}
