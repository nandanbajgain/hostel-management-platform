import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CleaningAssignmentStatus,
  ComplaintCategory,
  ComplaintStatus,
} from '@prisma/client';

@Injectable()
export class CleaningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listStaff() {
    return this.prisma.cleaningStaff.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(dto: { name: string; phone?: string; zone?: string }) {
    return this.prisma.cleaningStaff.create({
      data: {
        name: dto.name,
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.zone ? { zone: dto.zone } : {}),
      },
    });
  }

  async updateStaff(id: string, dto: Partial<{ name: string; phone: string; zone: string; isActive: boolean }>) {
    const existing = await this.prisma.cleaningStaff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Staff member not found');

    return this.prisma.cleaningStaff.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.zone !== undefined ? { zone: dto.zone } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async createAssignments(dto: {
    staffId: string;
    roomIds: string[];
    scheduledStart: string;
    scheduledEnd: string;
    notes?: string;
  }) {
    const staff = await this.prisma.cleaningStaff.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff || !staff.isActive) {
      throw new BadRequestException('Invalid staff member');
    }

    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid scheduledStart');
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid scheduledEnd');
    }
    if (end <= start) {
      throw new BadRequestException('scheduledEnd must be after scheduledStart');
    }

    const rooms = await this.prisma.room.findMany({
      where: { id: { in: dto.roomIds } },
      select: { id: true, number: true, allocations: { where: { isActive: true }, select: { userId: true, user: { select: { id: true } } } } },
    });
    if (rooms.length !== dto.roomIds.length) {
      throw new BadRequestException('One or more rooms are invalid');
    }

    const created = await this.prisma.$transaction(
      rooms.map((room) =>
        this.prisma.cleaningAssignment.create({
          data: {
            roomId: room.id,
            staffId: staff.id,
            scheduledStart: start,
            scheduledEnd: end,
            ...(dto.notes ? { notes: dto.notes } : {}),
          },
          include: { room: true, staff: true },
        }),
      ),
    );

    // Soft "night-before" notification (created immediately).
    for (const assignment of created) {
      const allocations = await this.prisma.roomAllocation.findMany({
        where: { roomId: assignment.roomId, isActive: true },
        select: { userId: true },
      });
      const when = formatLocalWindow(assignment.scheduledStart, assignment.scheduledEnd);
      for (const alloc of allocations) {
        void this.notifications.createAndSend(
          alloc.userId,
          'Room cleaning scheduled',
          `Your room will be cleaned on ${when}. Please keep the room accessible.`,
          'info',
        );
      }
    }

    return { total: created.length, assignments: created };
  }

  async listAssignments(params: {
    from?: string;
    to?: string;
    roomId?: string;
    staffId?: string;
    status?: CleaningAssignmentStatus;
  }) {
    const where: any = {};
    if (params.roomId) where.roomId = params.roomId;
    if (params.staffId) where.staffId = params.staffId;
    if (params.status) where.status = params.status;

    if (params.from || params.to) {
      where.scheduledStart = {};
      if (params.from) where.scheduledStart.gte = new Date(params.from);
      if (params.to) where.scheduledStart.lte = new Date(params.to);
    }

    const assignments = await this.prisma.cleaningAssignment.findMany({
      where,
      include: {
        room: { select: { id: true, number: true, block: true, floor: true } },
        staff: true,
        feedback: true,
      },
      orderBy: { scheduledStart: 'asc' },
      take: 500,
    });

    return assignments.map((a) => ({
      id: a.id,
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
      status: a.status,
      notes: a.notes,
      room: a.room,
      staff: { id: a.staff.id, name: a.staff.name, phone: a.staff.phone, zone: a.staff.zone },
      feedback: a.feedback
        ? {
            cleaned: a.feedback.cleaned,
            rating: a.feedback.rating,
            comment: a.feedback.comment,
            submittedAt: a.feedback.submittedAt,
          }
        : null,
    }));
  }

  async myUpcoming(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { allocation: { include: { room: true } } },
    });

    if (!user || !user.allocation?.isActive) {
      return { room: null, upcoming: null, feedbackDue: null };
    }

    const roomId = user.allocation.roomId;
    const now = new Date();

    const upcoming = await this.prisma.cleaningAssignment.findFirst({
      where: {
        roomId,
        status: 'SCHEDULED',
        scheduledEnd: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
      include: { staff: true, room: true, feedback: true },
      orderBy: { scheduledStart: 'asc' },
    });

    let feedbackDue = null as null | {
      assignmentId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      staffName: string;
      staffPhone: string | null;
    };

    const recentNeedingFeedback = await this.prisma.cleaningAssignment.findFirst({
      where: {
        roomId,
        status: { in: ['SCHEDULED', 'COMPLETED'] },
        scheduledEnd: { lte: now, gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
        feedback: { is: null },
      },
      include: { staff: true },
      orderBy: { scheduledEnd: 'desc' },
    });

    if (recentNeedingFeedback) {
      feedbackDue = {
        assignmentId: recentNeedingFeedback.id,
        scheduledStart: recentNeedingFeedback.scheduledStart,
        scheduledEnd: recentNeedingFeedback.scheduledEnd,
        staffName: recentNeedingFeedback.staff.name,
        staffPhone: recentNeedingFeedback.staff.phone || null,
      };
    }

    return {
      room: {
        id: user.allocation.room.id,
        number: user.allocation.room.number,
        block: user.allocation.room.block,
        floor: user.allocation.room.floor,
      },
      upcoming: upcoming
        ? {
            id: upcoming.id,
            scheduledStart: upcoming.scheduledStart,
            scheduledEnd: upcoming.scheduledEnd,
            status: upcoming.status,
            staff: {
              id: upcoming.staff.id,
              name: upcoming.staff.name,
              phone: upcoming.staff.phone || null,
              zone: upcoming.staff.zone || null,
            },
          }
        : null,
      feedbackDue,
    };
  }

  async submitFeedback(userId: string, dto: { assignmentId: string; cleaned: boolean; rating: number; comment?: string }) {
    const assignment = await this.prisma.cleaningAssignment.findUnique({
      where: { id: dto.assignmentId },
      include: { staff: true, room: true, feedback: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.feedback) throw new BadRequestException('Feedback already submitted');

    // Must belong to student's current room.
    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { userId },
      include: { room: true },
    });
    if (!allocation?.isActive || allocation.roomId !== assignment.roomId) {
      throw new ForbiddenException('You can only submit feedback for your assigned room');
    }

    const feedback = await this.prisma.cleaningFeedback.create({
      data: {
        assignmentId: assignment.id,
        userId,
        cleaned: dto.cleaned,
        rating: dto.rating,
        ...(dto.comment ? { comment: dto.comment } : {}),
      },
    });

    // Mark assignment completed if student confirms cleaned.
    if (dto.cleaned) {
      await this.prisma.cleaningAssignment.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED' },
      });
    }

    // Auto-escalate low ratings or "not cleaned" into a complaint.
    if (!dto.cleaned || dto.rating <= 2) {
      const staffInfo = assignment.staff.phone
        ? `${assignment.staff.name} (${assignment.staff.phone})`
        : assignment.staff.name;
      const window = formatLocalWindow(assignment.scheduledStart, assignment.scheduledEnd);

      await this.prisma.complaint.create({
        data: {
          userId,
          isAnonymous: false,
          category: 'CLEANING' as ComplaintCategory,
          title: 'Room cleaning issue',
          description:
            `Cleaning feedback flagged.\n` +
            `Room: ${assignment.room.number} (Block ${assignment.room.block}, Floor ${assignment.room.floor})\n` +
            `Scheduled: ${window}\n` +
            `Staff: ${staffInfo}\n` +
            `Student response: cleaned=${dto.cleaned ? 'yes' : 'no'}, rating=${dto.rating}\n` +
            `${dto.comment ? `Comment: ${dto.comment}` : ''}`,
          status: 'PENDING' as ComplaintStatus,
        },
      });

      await this.notifications.createAndSend(
        userId,
        'Cleaning issue flagged',
        'Thanks for your feedback. We created a cleaning issue ticket so the team can follow up.',
        'warning',
      );
    } else {
      await this.notifications.createAndSend(
        userId,
        'Cleaning feedback received',
        'Thanks for the feedback. This helps us improve housekeeping quality.',
        'success',
      );
    }

    return { ok: true, feedback };
  }

  async adminComplianceSummary(params: { days?: number }) {
    const days = params.days && params.days > 0 && params.days <= 90 ? params.days : 7;
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const rooms = await this.prisma.room.findMany({
      select: { id: true, number: true, block: true, floor: true, status: true },
    });

    const recent = await this.prisma.cleaningAssignment.findMany({
      where: { scheduledStart: { gte: since, lte: now } },
      select: { roomId: true, status: true, scheduledStart: true },
      orderBy: { scheduledStart: 'desc' },
    });

    const lastByRoom = new Map<string, { scheduledStart: Date; status: string }>();
    for (const a of recent) {
      if (!lastByRoom.has(a.roomId)) {
        lastByRoom.set(a.roomId, { scheduledStart: a.scheduledStart, status: a.status });
      }
    }

    const missing = rooms
      .filter((r) => r.status !== 'MAINTENANCE')
      .filter((r) => !lastByRoom.has(r.id))
      .map((r) => ({ id: r.id, number: r.number, block: r.block, floor: r.floor }));

    return {
      windowDays: days,
      totalRooms: rooms.length,
      roomsMissingCleaning: missing.length,
      missing,
    };
  }
}

function formatLocalWindow(start: Date, end: Date) {
  const date = start.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const st = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const et = end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${st} â€“ ${et}`;
}

