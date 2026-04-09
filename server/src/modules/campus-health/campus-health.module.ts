import { Module } from '@nestjs/common';
import { CampusHealthController } from './campus-health.controller';
import { CampusHealthService } from './campus-health.service';

@Module({
  controllers: [CampusHealthController],
  providers: [CampusHealthService],
  exports: [CampusHealthService],
})
export class CampusHealthModule {}

