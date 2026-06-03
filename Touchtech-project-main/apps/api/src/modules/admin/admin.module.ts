import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [RequestsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
