import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { RedisPresenceService } from './redis-presence.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.accessSecret'),
      }),
    }),
  ],
  providers: [TrackingGateway, TrackingService, RedisPresenceService],
  exports: [TrackingService, RedisPresenceService],
})
export class TrackingModule {}
