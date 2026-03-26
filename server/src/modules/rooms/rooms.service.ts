import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AllocateRoomDto, CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findAll(block?: string, floor?: number, status?: RoomStatus) {
    return this.prisma.room.findMany({
      where: {
        ...(block && { block }),
        ...(floor !== undefined && { floor }),
        ...(status && { status }),
      },
      include: {
        allocations: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: [{ block: 'asc' }, { floor: 'asc' }, { number: 'asc' }],
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        allocations: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findMyRoom(userId: string) {
    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { userId },
      include: {
        room: {
          include: {
            allocations: {
              where: { isActive: true },
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true },
                },
              },
            },
          },
        },
      },
    });

    if (!allocation?.isActive) {
      return null;
    }

    return allocation.room;
  }

  async create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        ...dto,
        capacity: dto.capacity ?? 2,
        amenities: dto.amenities ?? [],
      },
    });
  }

  async allocate(dto: AllocateRoomDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found');
    }
    if (student.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Student must be approved before room allocation');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
      include: { allocations: { where: { isActive: true } } },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.allocations.length >= room.capacity) {
      throw new BadRequestException('Room is at full capacity');
    }

    const existing = await this.prisma.roomAllocation.findUnique({
      where: { userId: dto.userId },
    });
    if (existing?.isActive) {
      throw new BadRequestException('Student already has a room allocated');
    }

    const allocation = await this.prisma.roomAllocation.upsert({
      where: { userId: dto.userId },
      update: {
        roomId: dto.roomId,
        isActive: true,
        vacatedAt: null,
        allocatedAt: new Date(),
      },
      create: { userId: dto.userId, roomId: dto.roomId },
    });

    const activeCount = room.allocations.length + 1;
    await this.prisma.room.update({
      where: { id: dto.roomId },
      data: {
        status: activeCount >= room.capacity ? 'OCCUPIED' : 'AVAILABLE',
      },
    });

    return allocation;
  }

  async deallocate(userId: string) {
    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { userId },
    });
    if (!allocation?.isActive) {
      throw new NotFoundException('No active allocation found');
    }

    await this.prisma.roomAllocation.update({
      where: { userId },
      data: { isActive: false, vacatedAt: new Date() },
    });

    const remaining = await this.prisma.roomAllocation.count({
      where: { roomId: allocation.roomId, isActive: true },
    });

    await this.prisma.room.update({
      where: { id: allocation.roomId },
      data: { status: remaining === 0 ? 'AVAILABLE' : 'AVAILABLE' },
    });

    return { message: 'Room deallocated successfully' };
  }

  async getStats() {
    const cacheKey = 'rooms:stats';
    const cached = await this.redisService.get<{
      total: number;
      occupied: number;
      available: number;
      maintenance: number;
      totalStudents: number;
      occupancyPercent: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [total, occupied, available, maintenance, totalStudents] =
      await Promise.all([
        this.prisma.room.count(),
        this.prisma.room.count({ where: { status: 'OCCUPIED' } }),
        this.prisma.room.count({ where: { status: 'AVAILABLE' } }),
        this.prisma.room.count({ where: { status: 'MAINTENANCE' } }),
        this.prisma.roomAllocation.count({ where: { isActive: true } }),
      ]);

    const stats = {
      total,
      occupied,
      available,
      maintenance,
      totalStudents,
      occupancyPercent: total ? Math.round((occupied / total) * 100) : 0,
    };
    await this.redisService.set(cacheKey, stats, 30);
    return stats;
  }
}
