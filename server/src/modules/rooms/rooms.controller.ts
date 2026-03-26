import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { AllocateRoomDto, CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoomStatus } from '@prisma/client';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(
    @Query('block') block?: string,
    @Query('floor') floor?: string,
    @Query('status') status?: RoomStatus,
  ) {
    return this.roomsService.findAll(
      block,
      floor ? Number.parseInt(floor, 10) : undefined,
      status,
    );
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  getStats() {
    return this.roomsService.getStats();
  }

  @Get('my')
  findMyRoom(@Req() req: { user: { id: string } }) {
    return this.roomsService.findMyRoom(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Post('allocate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  allocate(@Body() dto: AllocateRoomDto) {
    return this.roomsService.allocate(dto);
  }

  @Delete('deallocate/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WARDEN')
  deallocate(@Param('userId') userId: string) {
    return this.roomsService.deallocate(userId);
  }
}
