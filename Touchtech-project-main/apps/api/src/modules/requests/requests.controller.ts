import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createRequestSchema,
  listRequestsSchema,
  CreateRequestDto,
  ListRequestsDto,
} from './dto/request.dto';

@Controller({ path: 'requests', version: '1' })
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  @Roles('user', 'admin')
  @UsePipes(new ZodValidationPipe(createRequestSchema))
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequestDto) {
    return this.requests.create(user.id, dto);
  }

  @Get()
  @Roles('user', 'admin')
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listRequestsSchema)) query: ListRequestsDto,
  ) {
    return this.requests.list(user.id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.getOwned(BigInt(id), user.id, user.role === 'admin');
  }

  @Patch(':id/cancel')
  @Roles('user', 'admin')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.cancel(BigInt(id), user.id);
  }

  @Patch(':id/confirm')
  @Roles('user', 'admin')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.requests.confirm(BigInt(id), user.id);
  }
}
