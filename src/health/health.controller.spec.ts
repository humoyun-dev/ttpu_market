import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status when all services are healthy', async () => {
      const healthResponse = {
        ok: true,
        database: true,
        redis: true,
      };

      mockHealthService.check.mockResolvedValue(healthResponse);

      const result = await controller.check();

      expect(healthService.check).toHaveBeenCalled();
      expect(result).toEqual(healthResponse);
      expect(result.ok).toBe(true);
      expect(result.database).toBe(true);
      expect(result.redis).toBe(true);
    });

    it('should return unhealthy status when database fails', async () => {
      const healthResponse = {
        ok: false,
        database: false,
        redis: true,
      };

      mockHealthService.check.mockResolvedValue(healthResponse);

      const result = await controller.check();

      expect(result.ok).toBe(false);
      expect(result.database).toBe(false);
    });

    it('should return unhealthy status when redis fails', async () => {
      const healthResponse = {
        ok: false,
        database: true,
        redis: false,
      };

      mockHealthService.check.mockResolvedValue(healthResponse);

      const result = await controller.check();

      expect(result.ok).toBe(false);
      expect(result.redis).toBe(false);
    });
  });
});
