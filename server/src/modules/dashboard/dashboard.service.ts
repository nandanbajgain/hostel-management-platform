import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getAdminStats() {
    const cacheKey = 'dashboard:admin-stats';
    const cached = await this.redisService.get<{
      totalStudents: number;
      openComplaints: number;
      pendingMaintenance: number;
      occupiedRooms: number;
      availableRooms: number;
      totalRooms: number;
      occupancyPercent: number;
      recentActivity: unknown[];
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      totalStudents,
      openComplaints,
      pendingMaintenance,
      roomStats,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'STUDENT', approvalStatus: 'APPROVED', isActive: true },
      }),
      this.prisma.complaint.count({
        where: {
          status: { in: ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.maintenanceTask.count({
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      }),
      this.prisma.room.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.complaint.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          isAnonymous: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const occupied =
      roomStats.find((room) => room.status === 'OCCUPIED')?._count.status ?? 0;
    const available =
      roomStats.find((room) => room.status === 'AVAILABLE')?._count.status ?? 0;
    const total = roomStats.reduce((acc, room) => acc + room._count.status, 0);

    const stats = {
      totalStudents,
      openComplaints,
      pendingMaintenance,
      occupiedRooms: occupied,
      availableRooms: available,
      totalRooms: total,
      occupancyPercent: total ? Math.round((occupied / total) * 100) : 0,
      recentActivity,
    };
    await this.redisService.set(cacheKey, stats, 60);
    return stats;
  }
}
