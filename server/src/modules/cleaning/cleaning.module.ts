import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CleaningController } from './cleaning.controller';
import { CleaningService } from './cleaning.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CleaningController],
  providers: [CleaningService],
})
export class CleaningModule {}

