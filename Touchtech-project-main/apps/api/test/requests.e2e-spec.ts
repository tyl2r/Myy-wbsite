import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

/**
 * Exercises the request lifecycle over HTTP, including RBAC: a worker may not
 * create a request, and a user may create, read, and cancel their own.
 */
describe('Requests lifecycle (e2e)', () => {
  let app: NestFastifyApplication;
  let userToken: string;
  let workerToken: string;
  const stamp = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    userToken = await register('user');
    workerToken = await register('worker');
  });

  afterAll(async () => app.close());

  async function register(role: 'user' | 'worker'): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `req_${role}_${stamp}@example.com`,
        password: 'sufficiently-long-password',
        fullName: `${role} user`,
        role,
      },
    });
    return res.json().data.accessToken;
  }

  const createPayload = {
    pickup: { lat: 59.33, lng: 18.04 },
    pickupText: 'Pickup point',
    dropoff: { lat: 59.34, lng: 18.07 },
    dropoffText: 'Dropoff point',
    recipientName: 'Recipient',
    packageSize: 's',
  };

  it('forbids a worker from creating a request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/requests',
      headers: { authorization: `Bearer ${workerToken}` },
      payload: createPayload,
    });
    expect(res.statusCode).toBe(403);
  });

  it('lets a user create, read, and cancel a request', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/requests',
      headers: { authorization: `Bearer ${userToken}` },
      payload: createPayload,
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().data.id;

    const read = await app.inject({
      method: 'GET',
      url: `/api/v1/requests/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(read.statusCode).toBe(200);
    expect(read.json().data.status).toBe('created');

    const cancelled = await app.inject({
      method: 'PATCH',
      url: `/api/v1/requests/${id}/cancel`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().data.status).toBe('cancelled');
  });
});
