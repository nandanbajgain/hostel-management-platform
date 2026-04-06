import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateComplaintDto,
  UpdateComplaintStatusDto,
} from './dto/create-complaint.dto';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateComplaintDto) {
    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { userId },
      include: { room: { select: { number: true } } },
    });

    return this.prisma.complaint.create({
      data: {
        ...dto,
        userId,
        isAnonymous: false,
        roomNumber: allocation?.isActive ? allocation.room.number : null,
      },
    });
  }

  async findAll(status?: ComplaintStatus, category?: ComplaintCategory) {
    return this.prisma.complaint.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.adminNote && { adminNote: dto.adminNote }),
        ...(dto.status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    if (complaint.userId && !complaint.isAnonymous) {
      const statusMessages: Record<string, string> = {
        UNDER_REVIEW: 'Your complaint is now under review.',
        IN_PROGRESS: 'Work has started on your complaint.',
        RESOLVED: 'Your complaint has been resolved!',
        REJECTED: 'Your complaint has been reviewed and closed.',
      };

      const message = statusMessages[dto.status];
      if (message) {
        await this.notificationsService.createAndSend(
          complaint.userId,
          `Complaint Update: ${complaint.title}`,
          `${message}${dto.adminNote ? ` Admin note: ${dto.adminNote}` : ''}`,
          dto.status === 'RESOLVED' ? 'success' : 'info',
        );
      }
    }

    return updated;
  }

  async trackByToken(token: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { token: token.trim().toLowerCase() },
      select: {
        token: true,
        category: true,
        title: true,
        status: true,
        adminNote: true,
        roomNumber: true,
        createdAt: true,
        resolvedAt: true,
      },
    });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return complaint;
  }
}
