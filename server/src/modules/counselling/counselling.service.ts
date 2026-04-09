import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSessionDto,
  SendMessageDto,
  CloseSessionDto,
  RateSessionDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
} from './dto';
import { AppointmentStatus, SessionStatus, MessageType } from '@prisma/client';

@Injectable()
export class CounsellingService {
  constructor(private prisma: PrismaService) {}

  async createSession(studentId: string, dto: CreateSessionDto) {
    // Get first counsellor, or create one if none exists
    let counsellor = await this.prisma.counsellorProfile.findFirst();

    if (!counsellor) {
      // Try to get or create a counsellor user
      const counsellorUser = await this.prisma.user.findUnique({
        where: { email: 'counsellor@sau.ac.in' },
      });

      if (!counsellorUser) {
        throw new NotFoundException(
          'No counsellor available. Please contact administration.',
        );
      }

      // Create counsellor profile if it doesn't exist
      counsellor = await this.prisma.counsellorProfile.create({
        data: {
          userId: counsellorUser.id,
          bio: 'Hostel Student Counsellor',
          specialties: ['General Counselling'],
          availability: '9:00 AM – 5:00 PM',
          isOnline: true,
        },
      });
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

    const isParticipant =
      session.studentId === senderId || session.counsellor.userId === senderId;
    if (!isParticipant) {
      throw new ForbiddenException('Not allowed to send messages in this session');
    }

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
      data: {
        isOnline,
      },
    });
  }

  async setCounsellorStatus(userId: string, status: 'available' | 'busy' | 'away' | 'offline') {
    const isOnline = status !== 'offline';
    return this.prisma.counsellorProfile.update({
      where: { userId },
      data: {
        isOnline,
      },
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
      data: {
        isRead: true,
        readAt: new Date(),
      },
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

  async getSessionsWithUnreadMessages(counsellorId: string) {
    const counsellorProfile = await this.prisma.counsellorProfile.findUnique({
      where: { id: counsellorId },
      select: { userId: true },
    });

    if (!counsellorProfile) {
      throw new NotFoundException('Counsellor profile not found');
    }

    const sessions = await this.prisma.counsellingSession.findMany({
      where: { counsellorId },
      include: {
        student: true,
        messages: {
          where: { isRead: false, senderId: { not: counsellorProfile.userId } },
          orderBy: { sentAt: 'desc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return sessions.map((session) => ({
      ...session,
      unreadCount: session.messages.length,
      lastMessage: session.messages[0] || null,
    }));
  }

  async createAppointment(sessionId: string, userId: string, dto: CreateAppointmentDto) {
    const session = await this.getSessionById(sessionId);
    const isParticipant =
      session.studentId === userId || session.counsellor.userId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Not allowed to create appointments for this session');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }

    return this.prisma.counsellingAppointment.create({
      data: {
        sessionId,
        scheduledAt,
        durationMins: dto.durationMins ?? 30,
        note: dto.note,
        meetingLink: dto.meetingLink,
        createdById: userId,
        status: AppointmentStatus.REQUESTED,
      },
      include: {
        createdBy: true,
        session: { include: { student: true, counsellor: { include: { user: true } } } },
      },
    });
  }

  async getAppointmentsForSession(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId);
    const isParticipant =
      session.studentId === userId || session.counsellor.userId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Not allowed to view appointments for this session');
    }

    return this.prisma.counsellingAppointment.findMany({
      where: { sessionId },
      orderBy: { scheduledAt: 'asc' },
      include: { createdBy: true },
    });
  }

  async getAppointmentsForCounsellor(counsellorUserId: string) {
    const counsellorProfile = await this.getCounsellorProfile(counsellorUserId);
    return this.prisma.counsellingAppointment.findMany({
      where: { session: { counsellorId: counsellorProfile.id } },
      orderBy: { scheduledAt: 'asc' },
      include: {
        createdBy: true,
        session: { include: { student: true } },
      },
    });
  }

  async updateAppointment(
    appointmentId: string,
    counsellorUserId: string,
    dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.prisma.counsellingAppointment.findUnique({
      where: { id: appointmentId },
      include: { session: { include: { counsellor: { include: { user: true } } } } },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.session.counsellor.userId !== counsellorUserId) {
      throw new ForbiddenException('Only the assigned counsellor can update appointments');
    }

    return this.prisma.counsellingAppointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        durationMins: dto.durationMins,
        note: dto.note,
        meetingLink: dto.meetingLink,
      },
      include: {
        createdBy: true,
        session: { include: { student: true } },
      },
    });
  }

  async listJournalEntries(studentId: string) {
    return this.prisma.journalEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createJournalEntry(studentId: string, dto: CreateJournalEntryDto) {
    if (dto.sessionId) {
      const session = await this.getSessionById(dto.sessionId);
      if (session.studentId !== studentId) {
        throw new ForbiddenException('Cannot attach journal to another student session');
      }
    }

    return this.prisma.journalEntry.create({
      data: {
        studentId,
        sessionId: dto.sessionId,
        mood: dto.mood,
        title: dto.title,
        content: dto.content,
        isShared: dto.isShared ?? false,
      },
    });
  }

  async updateJournalEntry(entryId: string, studentId: string, dto: UpdateJournalEntryDto) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.studentId !== studentId) {
      throw new ForbiddenException('Not allowed to update this journal entry');
    }

    return this.prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        title: dto.title,
        content: dto.content,
        mood: dto.mood,
        isShared: dto.isShared,
      },
    });
  }

  async deleteJournalEntry(entryId: string, studentId: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.studentId !== studentId) {
      throw new ForbiddenException('Not allowed to delete this journal entry');
    }

    await this.prisma.journalEntry.delete({ where: { id: entryId } });
    return { ok: true };
  }

  async getStudentJournalForCounsellor(
    studentId: string,
    counsellorUserId: string,
    opts?: { sharedOnly?: boolean },
  ) {
    const counsellorProfile = await this.getCounsellorProfile(counsellorUserId);

    const hasSession = await this.prisma.counsellingSession.findFirst({
      where: { studentId, counsellorId: counsellorProfile.id },
      select: { id: true },
    });

    if (!hasSession) {
      throw new ForbiddenException('Not allowed to view this student journal');
    }

    return this.prisma.journalEntry.findMany({
      where: {
        studentId,
        ...(opts?.sharedOnly ? { isShared: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
