import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

/**
 * Thin wrapper exposing the Prisma client as an injectable singleton.
 * Geography columns are written/read through $queryRaw / $executeRaw using
 * PostGIS ST_* functions, since Prisma cannot type the geography type.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
