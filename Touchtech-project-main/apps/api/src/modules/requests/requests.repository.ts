import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRequestDto } from './dto/request.dto';
import { haversineMeters } from '../../common/geo/geo.util';

/**
 * Data access for requests. Geography columns are written with raw SQL because
 * Prisma cannot represent them; everything else uses the typed client.
 */
@Injectable()
export class RequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateRequestDto, priceCents: number) {
    const distanceM = Math.round(
      haversineMeters(dto.pickup, dto.dropoff),
    );

    // Insert with PostGIS points, then return the row id.
    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>(Prisma.sql`
      INSERT INTO requests (
        user_id, pickup_geom, pickup_text, dropoff_geom, dropoff_text,
        recipient_name, recipient_phone, package_size, notes,
        window_start, window_end, status, price_cents, distance_m,
        created_at, updated_at
      ) VALUES (
        ${userId},
        ST_SetSRID(ST_MakePoint(${dto.pickup.lng}, ${dto.pickup.lat}), 4326)::geography,
        ${dto.pickupText},
        ST_SetSRID(ST_MakePoint(${dto.dropoff.lng}, ${dto.dropoff.lat}), 4326)::geography,
        ${dto.dropoffText},
        ${dto.recipientName}, ${dto.recipientPhone ?? null},
        ${dto.packageSize}::"PackageSize", ${dto.notes ?? null},
        ${dto.windowStart ?? null}, ${dto.windowEnd ?? null},
        'created'::"RequestStatus", ${priceCents}, ${distanceM},
        now(), now()
      )
      RETURNING id
    `);
    return rows[0].id;
  }

  findById(id: bigint) {
    return this.prisma.request.findUnique({ where: { id } });
  }

  async listForUser(
    userId: bigint,
    status: RequestStatus | undefined,
    cursor: bigint | undefined,
    limit: number,
  ) {
    return this.prisma.request.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { id: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }
}
