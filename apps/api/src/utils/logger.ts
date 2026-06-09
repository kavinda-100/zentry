import pino from 'pino';
import { env } from '../lib/env';

const isProduction = env.NODE_ENV === 'production';

export const logger = pino({
  // Filter trace/debug logs out of production metrics automatically
  level: env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Clean string representations for monitoring rules
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },

  // Format beautifully locally, switch to ultra-fast JSON streams in production
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
