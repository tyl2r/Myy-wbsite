import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { BatchesService } from './batches.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(20000).default(5000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const acceptSchema = z.object({
  requestIds: z.array(z.coerce.bigint()).min(1).max(10),
});

@Controller({ path: 'batches', version: '1' })
@Roles('worker')
export class BatchesController {
  constructor(private readonly batches: BatchesService) {}

  @Get('nearby')
  nearby(@Query(new ZodValidationPipe(nearbySchema)) q: z.infer<typeof nearbySchema>): any {
    return this.batches.nearby({ lat: q.lat, lng: q.lng }, q.radius, q.limit);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.batches.myBatches(user.id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(acceptSchema))
  accept(
    @CurrentUser() user: AuthUser,
    @Body() dto: { requestIds: bigint[] },
  ) {
    return this.batches.accept(user.id, dto.requestIds);
  }
}
