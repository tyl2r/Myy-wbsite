import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LatLng } from '../../common/geo/geo.util';

/**
 * Owns the Redis connections used for live presence and cross-node fan-out.
 * Live worker positions live here (not in Postgres) so high-frequency updates
 * never touch the transactional database on the hot path.
 */
@Injectable()
export class RedisPresenceService implements OnModuleInit, OnModuleDestroy {
  private pub!: Redis;
  private sub!: Redis;

  private static readonly GEO_KEY = 'workers:geo';
  private static readonly PRESENCE_TTL_S = 30;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('redis.url')!;
    this.pub = new Redis(url);
    this.sub = new Redis(url);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pub?.quit();
    await this.sub?.quit();
  }

  /** Records a worker's latest position with a short TTL heartbeat. */
  async setPosition(workerId: bigint, point: LatLng): Promise<void> {
    const key = workerId.toString();
    await this.pub.geoadd(
      RedisPresenceService.GEO_KEY,
      point.lng,
      point.lat,
      key,
    );
    await this.pub.set(
      `worker:${key}:seen`,
      Date.now(),
      'EX',
      RedisPresenceService.PRESENCE_TTL_S,
    );
  }

  /** Publishes a tracking event for other nodes to fan out to their sockets. */
  async publish(channel: string, payload: unknown): Promise<void> {
    await this.pub.publish(channel, JSON.stringify(payload));
  }

  onMessage(handler: (channel: string, message: string) => void): void {
    this.sub.on('message', handler);
  }

  async subscribe(channel: string): Promise<void> {
    await this.sub.subscribe(channel);
  }
}
