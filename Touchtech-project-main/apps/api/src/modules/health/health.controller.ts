import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

/** Lightweight health check used by Railway and load balancers. */
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
