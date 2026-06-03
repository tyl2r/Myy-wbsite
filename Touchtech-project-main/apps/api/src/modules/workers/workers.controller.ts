import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { z } from 'zod';
import { WorkersService } from './workers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const latLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const availabilitySchema = z.object({ isAvailable: z.boolean() });
const corridorSchema = z.object({ points: z.array(latLng).min(2).max(100) });

@Controller({ path: 'workers', version: '1' })
@Roles('worker')
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.workers.getProfile(user.id);
  }

  @Patch('me/availability')
  @UsePipes(new ZodValidationPipe(availabilitySchema))
  setAvailability(
    @CurrentUser() user: AuthUser,
    @Body() dto: { isAvailable: boolean },
  ) {
    return this.workers.setAvailability(user.id, dto.isAvailable);
  }

  @Put('me/location')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(latLng))
  async updateLocation(
    @CurrentUser() user: AuthUser,
    @Body() dto: z.infer<typeof latLng>,
  ) {
    await this.workers.updateLocation(user.id, dto);
  }

  @Put('me/corridor')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(corridorSchema))
  async updateCorridor(
    @CurrentUser() user: AuthUser,
    @Body() dto: z.infer<typeof corridorSchema>,
  ) {
    await this.workers.updateCorridor(user.id, dto.points);
  }
}
