import { Test, type TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get(HealthService);
  });

  it('reports api alive', async () => {
    await expect(service.isAlive()).resolves.toEqual({ api: { status: 'up' } });
  });

  it('treats missing redis as optional up', async () => {
    await expect(service.checkRedis()).resolves.toMatchObject({
      redis: { status: 'up', optional: true },
    });
  });
});
