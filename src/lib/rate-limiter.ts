import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        showFriendlyErrorStack: true,
        connectTimeout: 2000,
        retryStrategy() {
          // Do not retry continuously to prevent console noise in offline development
          return null;
        }
      });

      redis.on('error', (err) => {
        console.warn('Redis connection failed (rate-limiting suspended):', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize Redis client:', e);
      return null;
    }
  }
  return redis;
}

/**
 * Checks if a specific IP address has exceeded the submission rate limit.
 * Threshold: 5 messages per 5 minutes (300 seconds)
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false; // Fail open if Redis cannot initialize

  try {
    const key = `rate-limit:messages:${ip}`;
    const limit = 5;
    const expirySec = 300;

    const currentCount = await client.incr(key);
    
    if (currentCount === 1) {
      await client.expire(key, expirySec);
    }

    if (currentCount > limit) {
      console.log(`Rate Limiter: Throttled IP ${ip}. Message count: ${currentCount}`);
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Redis rate limiter error (failing open):', 
      error instanceof Error ? error.message : error
    );
    return false; // Fail open to ensure form submissions continue
  }
}
