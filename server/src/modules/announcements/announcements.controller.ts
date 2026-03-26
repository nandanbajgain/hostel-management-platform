import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnnouncementsService } from './announcements.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll() {
    return this.announcementsService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  create(
    @Req() req: { user: { name: string; email: string } },
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(
      dto,
      `${req.user.name} (${req.user.email})`,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
