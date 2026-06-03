import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { UserRole, WorkerVerification } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  cursor: z.coerce.bigint().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const setStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

const verifyWorkerSchema = z.object({
  decision: z.nativeEnum(WorkerVerification),
});

const forceCancelSchema = z.object({
  reason: z.string().min(1).max(500),
});

@Controller({ path: 'admin', version: '1' })
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  @UsePipes(new ZodValidationPipe(listUsersSchema))
  listUsers(@Query() query: z.infer<typeof listUsersSchema>) {
    return this.admin.listUsers(query.role, query.cursor, query.limit);
  }

  @Patch('users/:id/status')
  @UsePipes(new ZodValidationPipe(setStatusSchema))
  setUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: z.infer<typeof setStatusSchema>,
  ) {
    return this.admin.setUserStatus(BigInt(id), dto.status);
  }

  @Patch('workers/:id/verification')
  @UsePipes(new ZodValidationPipe(verifyWorkerSchema))
  verifyWorker(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: z.infer<typeof verifyWorkerSchema>,
  ) {
    return this.admin.verifyWorker(BigInt(id), dto.decision);
  }

  @Post('requests/:id/cancel')
  @UsePipes(new ZodValidationPipe(forceCancelSchema))
  forceCancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: z.infer<typeof forceCancelSchema>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.admin.forceCancel(BigInt(id), actor.id, dto.reason);
  }

  @Get('live')
  liveSnapshot() {
    return this.admin.liveSnapshot();
  }

  @Get('metrics')
  metrics() {
    return this.admin.metrics();
  }
}
