import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  function makePrisma(create = jest.fn().mockResolvedValue({})) {
    return { notification: { create } } as any;
  }

  it('persists a notification via notify()', async () => {
    const prisma = makePrisma();
    const service = new NotificationsService(prisma);

    await service.notify(7n, 'status_change', { requestId: '1' });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 7n, type: 'status_change', payload: { requestId: '1' } },
    });
  });

  it('safeNotify swallows persistence errors', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db down'));
    const service = new NotificationsService(makePrisma(create));

    await expect(
      service.safeNotify(7n, 'system', { x: 1 }),
    ).resolves.toBeUndefined();
    expect(create).toHaveBeenCalled();
  });
});
