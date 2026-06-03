import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { RouteCompatService } from './route-compat.service';

@Module({
  controllers: [BatchesController],
  providers: [BatchesService, RouteCompatService],
  exports: [RouteCompatService],
})
export class BatchesModule {}
