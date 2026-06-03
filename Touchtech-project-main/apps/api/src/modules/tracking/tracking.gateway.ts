import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { TrackingService } from './tracking.service';
import { RedisPresenceService } from './redis-presence.service';

const locationSchema = z.object({
  batchId: z.coerce.bigint(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedMps: z.number().min(0).max(120).optional(),
});

const ADMIN_ROOM = 'track:all';
const requestRoom = (id: bigint | string) => `track:request:${id}`;

/** Max location updates a worker may send per second (per socket). */
const MAX_UPDATES_PER_SECOND = 2;

/**
 * Realtime tracking gateway. Authenticates each socket with the same access
 * token used for HTTP, then routes worker pings to the relevant customer rooms
 * and the global admin room. Cross-node delivery rides on Redis pub/sub.
 *
 * Rate limiting: each worker socket is allowed at most MAX_UPDATES_PER_SECOND
 * location:update events. Excess events are silently dropped to protect the
 * database and downstream sockets from flooding.
 */
@WebSocketGateway({ namespace: '/tracking', cors: true })
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server;

  /** Per-socket rate-limit state: { windowStart, count } */
  private readonly rateLimitMap = new Map<string, { windowStart: number; count: number }>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly tracking: TrackingService,
    private readonly presence: RedisPresenceService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.split(' ')[1] ?? '');
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = BigInt(payload.sub);
      client.data.role = payload.role;

      // Admins observe everything; customers can subscribe to their requests.
      if (payload.role === 'admin') {
        await client.join(ADMIN_ROOM);
      }

      client.on('disconnect', () => {
        this.rateLimitMap.delete(client.id);
      });
    } catch {
      client.disconnect(true);
    }
  }

  /** A customer subscribes to live tracking for a request they own. */
  @SubscribeMessage('track:subscribe')
  onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { requestId: string },
  ): void {
    void client.join(requestRoom(body.requestId));
  }

  /** Worker streams its position — rate-limited to MAX_UPDATES_PER_SECOND. */
  @SubscribeMessage('location:update')
  async onLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() raw: unknown,
  ): Promise<void> {
    if (client.data.role !== 'worker') return;

    // Per-socket sliding-window rate limit (1-second window).
    const now = Date.now();
    const rl = this.rateLimitMap.get(client.id) ?? { windowStart: now, count: 0 };
    if (now - rl.windowStart > 1000) {
      rl.windowStart = now;
      rl.count = 0;
    }
    rl.count++;
    this.rateLimitMap.set(client.id, rl);
    if (rl.count > MAX_UPDATES_PER_SECOND) return; // drop silently

    const parsed = locationSchema.safeParse(raw);
    if (!parsed.success) return;
    const { batchId, lat, lng, speedMps } = parsed.data;

    const { requestIds } = await this.tracking.ingest(client.data.userId, {
      batchId,
      point: { lat, lng },
      speedMps,
    });

    const event = {
      workerId: client.data.userId.toString(),
      batchId: batchId.toString(),
      lat,
      lng,
      at: Date.now(),
    };

    // Local fan-out plus cross-node publish.
    this.server.to(ADMIN_ROOM).emit('location:update', event);
    for (const id of requestIds) {
      this.server.to(requestRoom(id)).emit('location:update', event);
    }
    await this.presence.publish('tracking', { requestIds: requestIds.map(String), event });
  }
}
