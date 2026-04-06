import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../../infra/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AllocateRoomDto, CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

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
    // Prevent over-allocation by using a serializable transaction + re-checking counts.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const student = await tx.user.findUnique({
              where: { id: dto.userId },
            });
            if (!student || student.role !== 'STUDENT') {
              throw new NotFoundException('Student not found');
            }
            if (student.approvalStatus !== 'APPROVED') {
              throw new BadRequestException(
                'Student must be approved before room allocation',
              );
            }

            const room = await tx.room.findUnique({
              where: { id: dto.roomId },
              select: { id: true, capacity: true, status: true },
            });
            if (!room) {
              throw new NotFoundException('Room not found');
            }
            if (room.status === 'MAINTENANCE' || room.status === 'RESERVED') {
              throw new BadRequestException(
                `Room cannot be allocated while status is ${room.status}`,
              );
            }

            const existing = await tx.roomAllocation.findUnique({
              where: { userId: dto.userId },
              select: { isActive: true },
            });
            if (existing?.isActive) {
              throw new BadRequestException(
                'Student already has a room allocated',
              );
            }

            const activeCount = await tx.roomAllocation.count({
              where: { roomId: dto.roomId, isActive: true },
            });
            if (activeCount >= room.capacity) {
              throw new BadRequestException('Room is at full capacity');
            }

            const allocation = await tx.roomAllocation.upsert({
              where: { userId: dto.userId },
              update: {
                roomId: dto.roomId,
                isActive: true,
                vacatedAt: null,
                allocatedAt: new Date(),
              },
              create: { userId: dto.userId, roomId: dto.roomId },
            });

            const newCount = activeCount + 1;
            await tx.room.update({
              where: { id: dto.roomId },
              data: {
                status: newCount >= room.capacity ? 'OCCUPIED' : 'AVAILABLE',
              },
            });

            return allocation;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        // Retry on serialization failures (e.g. concurrent allocations)
        const message =
          error instanceof Error ? error.message.toLowerCase() : '';
        if (
          attempt < 2 &&
          (message.includes('could not serialize') ||
            message.includes('serialization') ||
            message.includes('deadlock'))
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Could not allocate room, please retry');
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

    const room = await this.prisma.room.findUnique({
      where: { id: allocation.roomId },
      select: { capacity: true },
    });

    await this.prisma.room.update({
      where: { id: allocation.roomId },
      data: {
        status: room && remaining >= room.capacity ? 'OCCUPIED' : 'AVAILABLE',
      },
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
