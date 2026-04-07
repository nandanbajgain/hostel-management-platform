import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSessionDto,
  SendMessageDto,
  CloseSessionDto,
  RateSessionDto,
} from './dto';
import { SessionStatus, MessageType } from '@prisma/client';

@Injectable()
export class CounsellingService {
  constructor(private prisma: PrismaService) {}

  async createSession(studentId: string, dto: CreateSessionDto) {
    // Get first counsellor (in production, implement counsellor assignment logic)
    const counsellor = await this.prisma.counsellorProfile.findFirst();

    if (!counsellor) {
      throw new NotFoundException('No counsellor available');
    }

    return this.prisma.counsellingSession.create({
      data: {
        studentId,
        counsellorId: counsellor.id,
        topic: dto.topic,
        mood: dto.mood,
        status: SessionStatus.OPEN,
      },
      include: {
        messages: true,
        student: true,
        counsellor: { include: { user: true } },
      },
    });
  }

  async getOrCreateActiveSession(studentId: string, counsellorId: string) {
    let session = await this.prisma.counsellingSession.findFirst({
      where: {
        studentId,
        counsellorId,
        status: { in: [SessionStatus.OPEN, SessionStatus.ACTIVE] },
      },
      include: {
        messages: { orderBy: { sentAt: 'asc' } },
        student: true,
        counsellor: { include: { user: true } },
      },
    });

    if (!session) {
      session = await this.createSession(studentId, {});
    }

    return session;
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.counsellingSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { sentAt: 'asc' } },
        student: true,
        counsellor: { include: { user: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getSessionsByStudent(studentId: string) {
    return this.prisma.counsellingSession.findMany({
      where: { studentId },
      orderBy: { startedAt: 'desc' },
      include: {
        counsellor: { include: { user: true } },
        messages: { take: 1, orderBy: { sentAt: 'desc' } },
      },
    });
  }

  async getSessionsByCounsellor(counsellorId: string, filters?: any) {
    const where: any = { counsellorId };

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.counsellingSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        student: true,
        messages: { take: 1, orderBy: { sentAt: 'desc' } },
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });
  }

  async sendMessage(sessionId: string, senderId: string, dto: SendMessageDto) {
    const session = await this.getSessionById(sessionId);

    if (session.status === SessionStatus.CLOSED) {
      throw new BadRequestException('Cannot send message to closed session');
    }

    // Update session status to ACTIVE if OPEN
    if (session.status === SessionStatus.OPEN) {
      await this.prisma.counsellingSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.ACTIVE },
      });
    }

    return this.prisma.counsellingMessage.create({
      data: {
        sessionId,
        senderId,
        content: dto.content,
        type: dto.type || MessageType.TEXT,
      },
      include: { sender: true },
    });
  }

  async closeSession(sessionId: string, counsellorId: string, dto: CloseSessionDto) {
    const session = await this.getSessionById(sessionId);

    if (session.counsellorId !== counsellorId) {
      throw new BadRequestException('Only assigned counsellor can close session');
    }

    return this.prisma.counsellingSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        closedAt: new Date(),
        sessionNotes: dto.sessionNotes,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
      include: {
        messages: true,
        student: true,
        counsellor: { include: { user: true } },
      },
    });
  }

  async rateSession(sessionId: string, studentId: string, dto: RateSessionDto) {
    const session = await this.getSessionById(sessionId);

    if (session.studentId !== studentId) {
      throw new BadRequestException('Only session student can rate');
    }

    if (session.status !== SessionStatus.CLOSED) {
      throw new BadRequestException('Can only rate closed sessions');
    }

    return this.prisma.counsellingSession.update({
      where: { id: sessionId },
      data: {
        rating: dto.rating,
        ratingComment: dto.ratingComment,
      },
    });
  }

  async getStudentProfile(studentId: string) {
    return this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        allocation: { include: { room: true } },
        complaints: { orderBy: { createdAt: 'desc' }, take: 5 },
        studentSessions: { take: 5, orderBy: { startedAt: 'desc' } },
      },
    });
  }

  async getCounsellorProfile(userId: string) {
    const profile = await this.prisma.counsellorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Counsellor profile not found');
    }

    return profile;
  }

  async updateCounsellorProfile(userId: string, data: any) {
    return this.prisma.counsellorProfile.update({
      where: { userId },
      data,
      include: { user: true },
    });
  }

  async setCounsellorOnlineStatus(userId: string, isOnline: boolean) {
    return this.prisma.counsellorProfile.update({
      where: { userId },
      data: { isOnline },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.counsellingMessage.count({
      where: {
        isRead: false,
        session: {
          OR: [{ studentId: userId }, { counsellor: { userId } }],
        },
      },
    });
  }

  async markMessagesAsRead(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId);

    // User can mark messages they didn't send
    return this.prisma.counsellingMessage.updateMany({
      where: {
        sessionId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async searchSessions(counsellorId: string, query: string) {
    return this.prisma.counsellingSession.findMany({
      where: {
        counsellorId,
        OR: [
          { student: { name: { contains: query, mode: 'insensitive' } } },
          { topic: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        student: true,
        messages: { take: 1, orderBy: { sentAt: 'desc' } },
      },
    });
  }

  async getCounsellorStats(counsellorId: string) {
    const sessions = await this.prisma.counsellingSession.findMany({
      where: { counsellorId },
    });

    const openCount = sessions.filter((s) => s.status === SessionStatus.OPEN).length;
    const totalCount = sessions.length;
    const ratings = sessions
      .filter((s) => s.rating !== null)
      .map((s) => s.rating as number);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;
    const uniqueStudents = new Set(sessions.map((s) => s.studentId)).size;

    return {
      openSessions: openCount,
      totalSessions: totalCount,
      averageRating: Math.round(averageRating * 10) / 10,
      uniqueStudents,
      thisWeekSessions: sessions.filter(
        (s) => new Date(s.startedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).length,
    };
  }
}
