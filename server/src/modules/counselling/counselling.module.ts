import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { CounsellingController } from './counselling.controller';
import { CounsellingGateway } from './counselling.gateway';
import { CounsellingService } from './counselling.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [CounsellingController],
  providers: [CounsellingService, CounsellingGateway],
  exports: [CounsellingService],
})
export class CounsellingModule {}
