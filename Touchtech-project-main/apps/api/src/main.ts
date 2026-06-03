import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  // Structured logging via pino, wired as the Nest logger.
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [];
  const port = config.get<number>('app.port') ?? 3000;

  await app.register(helmet, { contentSecurityPolicy: false });

  // Cookie support for httpOnly refresh tokens.
  await app.register(fastifyCookie, {
    secret: config.get<string>('jwt.accessSecret'), // signs cookies
  });

  // Redis-backed Socket.IO adapter so tracking fan-out works across nodes.
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connect(config.get<string>('redis.url')!);
  app.useWebSocketAdapter(redisAdapter);

  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Defense in depth: even though most validation uses the Zod pipe per-route,
  // strip unknown properties globally.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));

  app.enableShutdownHooks();

  await app.listen({ port, host: '0.0.0.0' });
}

void bootstrap();
