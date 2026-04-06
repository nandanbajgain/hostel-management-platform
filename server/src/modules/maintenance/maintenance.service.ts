import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  UpdateMaintenanceStatusDto,
} from './dto/create-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateMaintenanceDto,
    creator?: { id: string; role: string; name: string; email: string },
  ) {
    const isPrivileged = creator?.role === 'ADMIN' || creator?.role === 'WARDEN';
    const isPublic = isPrivileged ? dto.isPublic ?? true : false;
    return this.prisma.maintenanceTask.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        assignedTo: dto.assignedTo,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        createdByUserId: creator?.id,
        isPublic,
      },
    });
  }

  async findAllForUser(
    user: { id: string; role: string },
    status?: MaintenanceStatus,
  ) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'WARDEN';
    return this.prisma.maintenanceTask.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(isPrivileged
          ? {}
          : {
              OR: [{ createdByUserId: user.id }, { isPublic: true }],
            }),
      },
      include: isPrivileged
        ? {
            createdByUser: { select: { id: true, name: true, email: true } },
          }
        : undefined,
      orderBy: [
        { status: 'asc' },
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async update(id: string, dto: UpdateMaintenanceDto) {
    await this.ensureExists(id);
    return this.prisma.maintenanceTask.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
      },
    });
  }

  async updateStatus(id: string, dto: UpdateMaintenanceStatusDto) {
    await this.ensureExists(id);
    return this.prisma.maintenanceTask.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.maintenanceTask.delete({ where: { id } });
    return { message: 'Maintenance task deleted successfully' };
  }

  private async ensureExists(id: string) {
    const task = await this.prisma.maintenanceTask.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException('Maintenance task not found');
    }

    return task;
  }
}
