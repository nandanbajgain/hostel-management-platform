import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MaintenanceStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  UpdateMaintenanceStatusDto,
} from './dto/create-maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@Query('status') status?: MaintenanceStatus) {
    return this.maintenanceService.findAll(status);
  }

  @Post()
  create(
    @Req() req: { user: { name: string; email: string } },
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.maintenanceService.create(dto, `${req.user.name} (${req.user.email})`);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMaintenanceStatusDto) {
    return this.maintenanceService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}
