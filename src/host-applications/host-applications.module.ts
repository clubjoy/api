import { Module } from '@nestjs/common';
import { HostApplicationsService } from './host-applications.service';
import { HostApplicationsController } from './host-applications.controller';

@Module({
  controllers: [HostApplicationsController],
  providers: [HostApplicationsService],
  exports: [HostApplicationsService],
})
export class HostApplicationsModule {}
