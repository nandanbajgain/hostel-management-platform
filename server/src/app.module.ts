import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './infra/redis/redis.module';
import { RedisThrottlerStorage } from './infra/redis/redis-throttler.storage';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorage],
      useFactory: (storage: RedisThrottlerStorage) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
        storage,
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    RoomsModule,
    ComplaintsModule,
    NotificationsModule,
    ChatbotModule,
    CleaningModule,
    UploadModule,
    UsersModule,
    MaintenanceModule,
    AnnouncementsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
