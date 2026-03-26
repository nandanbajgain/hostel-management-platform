import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateAnnouncementDto, createdBy: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        isUrgent: dto.isUrgent ?? false,
        createdBy,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.notificationsService.broadcastAnnouncement(
      announcement.title,
      announcement.content,
      announcement.isUrgent,
    );

    return announcement;
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.ensureExists(id);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        isUrgent: dto.isUrgent,
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }

  private async ensureExists(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }
}
