import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CounsellingService } from './counselling.service';
import { CounsellingGateway } from './counselling.gateway';
import {
  CreateSessionDto,
  SendMessageDto,
  CloseSessionDto,
  RateSessionDto,
} from './dto';

type AuthenticatedRequest = Request & {
  user: { id: string; role: string; email: string; name: string };
};

@ApiTags('Counselling')
@Controller('counselling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CounsellingController {
  constructor(
    private readonly counsellingService: CounsellingService,
    private readonly counsellingGateway: CounsellingGateway,
  ) {}

  @Post('sessions')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async createSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSessionDto,
  ) {
    return this.counsellingService.createSession(req.user.id, dto);
  }

  @Get('sessions/mine')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async getMySessions(@Req() req: AuthenticatedRequest) {
    return this.counsellingService.getSessionsByStudent(req.user.id);
  }

  @Get('sessions/:id')
  async getSessionById(@Param('id') sessionId: string) {
    return this.counsellingService.getSessionById(sessionId);
  }

  @Post('sessions/:id/close')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async closeSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: CloseSessionDto,
  ) {
    const counsellorProfile =
      await this.counsellingService.getCounsellorProfile(req.user.id);
    return this.counsellingService.closeSession(
      sessionId,
      counsellorProfile.id,
      dto,
    );
  }

  @Post('sessions/:id/rate')
  @Roles('STUDENT')
  @UseGuards(RolesGuard)
  async rateSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: RateSessionDto,
  ) {
    return this.counsellingService.rateSession(sessionId, req.user.id, dto);
  }

  @Get('dashboard')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const counsellorProfile =
      await this.counsellingService.getCounsellorProfile(req.user.id);
    return this.counsellingService.getSessionsByCounsellor(counsellorProfile.id, {
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('student/:id/profile')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async getStudentProfile(@Param('id') studentId: string) {
    return this.counsellingService.getStudentProfile(studentId);
  }

  @Get('profile')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.counsellingService.getCounsellorProfile(req.user.id);
  }

  @Patch('profile')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() data: any,
  ) {
    return this.counsellingService.updateCounsellorProfile(req.user.id, data);
  }

  @Get('unread')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    return {
      count: await this.counsellingService.getUnreadCount(req.user.id),
    };
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.counsellingService.sendMessage(
      sessionId,
      req.user.id,
      dto,
    );

    // Keep REST and WebSocket clients in sync.
    this.counsellingGateway.emitSessionMessage(sessionId, {
      id: message.id,
      sessionId,
      senderId: message.senderId,
      senderName: message.sender?.name,
      content: message.content,
      type: message.type,
      sentAt: message.sentAt,
    });

    return message;
  }

  @Get('search')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('q') query: string,
  ) {
    const counsellorProfile =
      await this.counsellingService.getCounsellorProfile(req.user.id);
    return this.counsellingService.searchSessions(counsellorProfile.id, query);
  }

  @Get('stats')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async getStats(@Req() req: AuthenticatedRequest) {
    const counsellorProfile =
      await this.counsellingService.getCounsellorProfile(req.user.id);
    return this.counsellingService.getCounsellorStats(counsellorProfile.id);
  }

  @Patch('status')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Body() data: { status: 'available' | 'busy' | 'away' | 'offline' },
  ) {
    return this.counsellingService.setCounsellorStatus(req.user.id, data.status);
  }

  @Get('unread-sessions')
  @Roles('COUNSELLOR')
  @UseGuards(RolesGuard)
  async getUnreadSessions(@Req() req: AuthenticatedRequest) {
    const counsellorProfile =
      await this.counsellingService.getCounsellorProfile(req.user.id);
    return this.counsellingService.getSessionsWithUnreadMessages(counsellorProfile.id);
  }

  @Patch('sessions/:id/mark-read')
  async markSessionRead(@Param('id') sessionId: string, @Req() req: AuthenticatedRequest) {
    return this.counsellingService.markMessagesAsRead(sessionId, req.user.id);
  }
}
