import { Body, Controller, Get, Patch, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { UsersService } from './users.service';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(20).nullable().optional(),
});
type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
