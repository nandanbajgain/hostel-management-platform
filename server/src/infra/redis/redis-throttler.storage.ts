import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

type RedisThrottlerRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<RedisThrottlerRecord> {
    const redis = this.redisService.raw;
    const hitsKey = `throttle:${throttlerName}:${key}:hits`;
    const blockKey = `throttle:${throttlerName}:${key}:block`;

    const totalHits = await redis.incr(hitsKey);
    if (totalHits === 1) {
      await redis.pexpire(hitsKey, ttl);
    }

    let timeToExpire = await redis.pttl(hitsKey);
    if (timeToExpire < 0) {
      timeToExpire = ttl;
      await redis.pexpire(hitsKey, ttl);
    }

    let isBlocked = (await redis.exists(blockKey)) === 1;
    let timeToBlockExpire = isBlocked ? await redis.pttl(blockKey) : 0;

    if (!isBlocked && totalHits > limit) {
      const effectiveBlockDuration = blockDuration || ttl;
      await redis.set(blockKey, '1', 'PX', effectiveBlockDuration);
      isBlocked = true;
      timeToBlockExpire = effectiveBlockDuration;
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: Math.max(timeToBlockExpire, 0),
    };
  }
}
