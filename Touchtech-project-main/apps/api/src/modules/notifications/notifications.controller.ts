import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { NotificationsService } from './notifications.service';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const listSchema = z.object({
  cursor: z.coerce.bigint().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listSchema)) q: z.infer<typeof listSchema>,
  ) {
    return this.notifications.list(user.id, q.cursor, q.limit);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, BigInt(id));
  }

  @Patch('read-all')
  markAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }
}
