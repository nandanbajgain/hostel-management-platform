import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello() {
    return {
      name: 'Hostel Management Platform API',
      version: 'v1',
      status: 'ok',
    };
  }

  @Get('health')
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    };
  }
}
