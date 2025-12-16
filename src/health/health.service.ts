import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const dbHealthy = await this.prisma.isHealthy();
    const redisHealthy = await this.redis.isHealthy();

    if (!dbHealthy || !redisHealthy) {
      throw new ServiceUnavailableException({
        ok: false,
        database: dbHealthy,
        redis: redisHealthy,
      });
    }

    return {
      ok: true,
      database: dbHealthy,
      redis: redisHealthy,
    };
  }
}
