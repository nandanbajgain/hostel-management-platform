import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { LeaveStatus, Role } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async applyLeave(studentId: string, dto: CreateLeaveDto) {
    // Validate dates
    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      throw new BadRequestException('From date cannot be in the past');
    }

    if (toDate <= fromDate) {
      throw new BadRequestException('To date must be after from date');
    }

    // Calculate duration
    const durationDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (durationDays > 30) {
      throw new BadRequestException('Maximum leave duration is 30 days');
    }

    // Check if student has pending leave
    const existingPendingLeave = await this.prisma.leave.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'APPROVED_BY_WARDEN'] },
      },
    });

    if (existingPendingLeave) {
      throw new BadRequestException(
        'You already have a pending or warden-approved leave. Please wait or cancel it first.',
      );
    }

    // Create leave
    return this.prisma.leave.create({
      data: {
        studentId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        fromDate,
        toDate,
        destination: dto.destination,
        contactNumber: dto.contactNumber,
        parentContact: dto.parentContact,
        status: 'PENDING',
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }

  async getMyLeaves(studentId: string) {
    return this.prisma.leave.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }

  async getAllLeaves(filters?: {
    status?: LeaveStatus;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.fromDate = {};
      if (filters.fromDate) {
        where.fromDate.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.toDate = where.toDate || {};
        where.toDate.lte = new Date(filters.toDate);
      }
    }

    return this.prisma.leave.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true, email: true, enrollmentNo: true } } },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });
  }

  async getLeaveById(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
      include: { student: { select: { id: true, name: true, email: true, enrollmentNo: true } } },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async updateLeaveStatus(id: string, dto: UpdateLeaveStatusDto, userRole: string) {
    const leave = await this.getLeaveById(id);

    // Validate transitions based on role
    if (userRole === Role.WARDEN) {
      if (leave.status !== 'PENDING') {
        throw new BadRequestException('Can only approve/reject leaves in PENDING status');
      }
      if (!['APPROVED_BY_WARDEN', 'REJECTED'].includes(dto.status)) {
        throw new ForbiddenException('Warden can only approve (set to APPROVED_BY_WARDEN) or reject');
      }
    } else if (userRole === Role.ADMIN) {
      if (leave.status !== 'APPROVED_BY_WARDEN') {
        throw new BadRequestException('Can only approve/reject leaves that are APPROVED_BY_WARDEN');
      }
      if (!['APPROVED', 'REJECTED'].includes(dto.status)) {
        throw new ForbiddenException('Admin can only approve (set to APPROVED) or reject');
      }
    } else {
      throw new ForbiddenException('Only warden or admin can update leave status');
    }

    const remark = userRole === Role.WARDEN ? 'wardenRemark' : 'adminRemark';
    const updateData: any = { status: dto.status };
    if (dto.remark) {
      updateData[remark] = dto.remark;
    }

    const updatedLeave = await this.prisma.leave.update({
      where: { id },
      data: updateData,
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    // Emit Socket.IO notification to student
    this.notificationsGateway.notifyUser(
      updatedLeave.studentId,
      'leave:status-updated',
      {
        leaveId: updatedLeave.id,
        status: updatedLeave.status,
        message: `Your leave request has been ${dto.status === 'APPROVED' ? 'approved' : dto.status === 'APPROVED_BY_WARDEN' ? 'approved by warden' : 'rejected'}`,
      },
    );

    return updatedLeave;
  }

  async cancelLeave(id: string, studentId: string) {
    const leave = await this.getLeaveById(id);

    if (leave.studentId !== studentId) {
      throw new ForbiddenException('You can only cancel your own leaves');
    }

    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel leaves in PENDING status');
    }

    return this.prisma.leave.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }

  async getLeaveStatistics() {
    const [total, pending, approvedByWarden, approved, rejected, cancelled] = await Promise.all([
      this.prisma.leave.count(),
      this.prisma.leave.count({ where: { status: 'PENDING' } }),
      this.prisma.leave.count({ where: { status: 'APPROVED_BY_WARDEN' } }),
      this.prisma.leave.count({ where: { status: 'APPROVED' } }),
      this.prisma.leave.count({ where: { status: 'REJECTED' } }),
      this.prisma.leave.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      approvedByWarden,
      approved,
      rejected,
      cancelled,
    };
  }
}
