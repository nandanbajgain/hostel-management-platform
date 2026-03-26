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

  async create(dto: CreateMaintenanceDto, createdBy?: string) {
    return this.prisma.maintenanceTask.create({
      data: {
        title: dto.title,
        description: createdBy
          ? `${dto.description}\n\nSubmitted by: ${createdBy}`
          : dto.description,
        location: dto.location,
        assignedTo: dto.assignedTo,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
      },
    });
  }

  async findAll(status?: MaintenanceStatus) {
    return this.prisma.maintenanceTask.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
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
    const task = await this.prisma.maintenanceTask.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Maintenance task not found');
    }

    return task;
  }
}
