import { RequestsService } from './requests.service';
import {
  ForbiddenError,
  NotFoundError,
  InvalidTransitionError,
} from '../../common/errors/domain.error';

describe('RequestsService', () => {
  const notifications = {
    safeNotify: jest.fn().mockResolvedValue(undefined),
  } as any;

  function makeService(repo: any, prisma: any = {}) {
    return new RequestsService(prisma, repo, notifications);
  }

  beforeEach(() => jest.clearAllMocks());

  it('rejects reading a request the caller does not own', async () => {
    const repo = { findById: jest.fn().mockResolvedValue({ id: 1n, userId: 99n }) };
    const service = makeService(repo);

    await expect(service.getOwned(1n, 5n)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('allows admins to read any request', async () => {
    const repo = { findById: jest.fn().mockResolvedValue({ id: 1n, userId: 99n }) };
    const service = makeService(repo);

    const res = await service.getOwned(1n, 5n, true);
    expect(res.data.id).toBe(1n);
  });

  it('throws NotFound when cancelling a missing request', async () => {
    const repo = { findById: jest.fn().mockResolvedValue(null) };
    const service = makeService(repo);

    await expect(service.cancel(1n, 5n)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('forbids cancelling once past the cancellable window', async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({ id: 1n, userId: 5n, status: 'in_transit' }),
    };
    const service = makeService(repo);

    await expect(service.cancel(1n, 5n)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('notifies the owner and writes an event on a valid transition', async () => {
    const tx = {
      request: { update: jest.fn().mockResolvedValue({ id: 1n, userId: 5n, status: 'matched' }) },
      statusEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn((cb: any) => cb(tx)) };
    const service = makeService({}, prisma);

    await service.transition(1n, 'created', 'matched', 5n);

    expect(tx.statusEvent.create).toHaveBeenCalled();
    expect(notifications.safeNotify).toHaveBeenCalledWith(
      5n,
      'status_change',
      expect.objectContaining({ from: 'created', to: 'matched' }),
    );
  });

  it('rejects an illegal transition before touching the database', async () => {
    const prisma = { $transaction: jest.fn() };
    const service = makeService({}, prisma);

    await expect(
      service.transition(1n, 'created', 'confirmed', 5n),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
