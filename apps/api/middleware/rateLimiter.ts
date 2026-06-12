import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { ErrorResponse } from '../utils/responseHandles';
import { StatusCodes } from '../utils/statusCodes';
import { logger } from '../utils/logger';

/**
 * @interface RateLimiterOptions
 * @description The RateLimiterOptions interface defines the configuration options for the rateLimiter middleware.
 * It includes the windowMs, maxRequests, message, and isStrict properties.
 * @property {number} windowMs - The time window size in milliseconds.
 * @property {number} maxRequests - The maximum number of requests allowed within the time window.
 * @property {string} [message] - An optional custom rejection message.
 * @property {boolean} isStrict - A flag indicating whether strict rate limiting is enabled.
 * */
interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  isStrict: boolean;
}

/**
 * @description The rateLimiter middleware function is responsible for rate limiting incoming requests based on the provided options.
 * It uses Redis to store and manage request timestamps within a sliding time window.
 * @param {RateLimiterOptions} options - The option object containing configuration parameters for rate limiting.
 * */
const rateLimiter = (options: RateLimiterOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clientIp = req.ip || req.socket.remoteAddress;
    const routePath = req.path;
    const strictMode = options.isStrict ? 'Strict' : 'Standard';

    // if no IP address is available
    if (!clientIp) {
      ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'IP address is not available. Please check your request headers.',
      );
    }

    // Namespace keys securely inside Redis
    const redisKey = `rate_limit:${strictMode}:${clientIp}:${routePath}`;

    const now = Date.now();
    const windowStart = now - options.windowMs;

    try {
      // Execute an atomic transaction via a Redis multi-chain pipeline
      const totalRequestsWithinWindow = await redis
        .multi()
        .zRemRangeByScore(redisKey, 0, windowStart) // 1. Evict logs older than our sliding boundary
        .zCard(redisKey) // 2. Count remaining active request timestamps
        .zRange(redisKey, 0, 0) // 3. Capture the oldest in-window request timestamp
        .exec();

      // The second item in our transaction results represents the zCard count
      const zCardReply = totalRequestsWithinWindow?.[1];
      const currentRequestCount = typeof zCardReply === 'number' ? zCardReply : 0;

      if (currentRequestCount >= options.maxRequests) {
        logger.warn(
          { ip: clientIp, path: routePath, attempts: currentRequestCount },
          'Rate limit restriction threshold breached',
        );

        const oldestRequestReply = totalRequestsWithinWindow?.[2];
        const oldestRequestTimestamp =
          Array.isArray(oldestRequestReply) &&
          typeof oldestRequestReply[0] === 'string' &&
          !Number.isNaN(Number(oldestRequestReply[0]))
            ? Number(oldestRequestReply[0])
            : now;
        const retryAfterMs = Math.max(0, oldestRequestTimestamp + options.windowMs - now);
        const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

        res.setHeader('Retry-After', retryAfterSeconds.toString());

        return ErrorResponse(
          res,
          StatusCodes.TOO_MANY_REQUESTS,
          options.message ||
            `Too many requests in the specified time window. Please try again later.`,
          {
            retryAfter: `${retryAfterSeconds} seconds`,
          },
        );
      }

      // Log the current valid access timestamp back into the Redis Sorted Set
      // Using 'now' as both the value and the sort score
      await redis
        .multi()
        .zAdd(redisKey, { score: now, value: now.toString() })
        .pExpire(redisKey, options.windowMs) // Ensure the key auto-destroys if traffic halts
        .exec();

      next();
    } catch (error) {
      // Fail to open gracefully if the Redis cache encounters an exception—never block legitimate users
      logger.error({ error }, 'Rate limiter component execution failure fallback');
      next();
    }
  };
};

/**
 * STRICT MODE: Critical Auth Endpoints (e.g., login, password reset)
 * Enforces a tight limit of 5 requests per 5 minutes to mitigate brute-force attacks
 **/
export const strictRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many requests from this IP address. Please try again in 5 minutes.',
  isStrict: true,
});

/**
 * STANDARD MODE: General API Endpoints
 * Allows a more generous limit of 60 requests per minute for typical usage patterns
 **/
export const standardRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3, // just for testing adjust as needed
  message: 'Too many requests from this IP address. Please try again later.',
  isStrict: false,
});
