import { TrackingService } from './tracking.service';
import { ForbiddenError } from '../../common/errors/domain.error';

describe('TrackingService', () => {
  const presence = { setPosition: jest.fn().mockResolvedValue(undefined) } as any;

  beforeEach(() => jest.clearAllMocks());

  it('rejects pings for a batch the worker does not own', async () => {
    const prisma = {
      batch: { findUnique: jest.fn().mockResolvedValue({ id: 1n, workerId: 42n, items: [] }) },
      $executeRaw: jest.fn(),
    } as any;
    const service = new TrackingService(prisma, presence);

    await expect(
      service.ingest(7n, { batchId: 1n, point: { lat: 1, lng: 1 } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('persists the ping and returns affected request ids', async () => {
    const prisma = {
      batch: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          workerId: 7n,
          items: [{ requestId: 10n }, { requestId: 11n }],
        }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new TrackingService(prisma, presence);

    const result = await service.ingest(7n, {
      batchId: 1n,
      point: { lat: 59.33, lng: 18.06 },
      speedMps: 5,
    });

    expect(presence.setPosition).toHaveBeenCalledWith(7n, { lat: 59.33, lng: 18.06 });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(result.requestIds).toEqual([10n, 11n]);
  });
});
