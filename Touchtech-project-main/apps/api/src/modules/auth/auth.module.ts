import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionCleanupService } from './session-cleanup.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.accessSecret'),
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, SessionCleanupService],
  exports: [TokenService],
})
export class AuthModule {}
