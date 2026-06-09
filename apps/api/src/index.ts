import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './lib/env';
import { redis } from './lib/redis';
import { prisma } from '@zentry/database';
import mainRouterV1 from './routes';
import { errorHandler } from './middleware/errorHandler';
import { ErrorResponse } from './utils/responseHandles';
import { StatusCodes } from './utils/statusCodes';
import { logger } from './utils/logger';

const app = express();

// middlewares
app.use(
  cors({
    origin: true, // Configured to allow clean cross-tenant visual UI redirections
    credentials: true,
  }),
);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Logging Middleware
app.use(
  pinoHttp({
    logger,
    // Custom metadata bindings (optional)
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, ip: req.remoteAddress }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// Routes
app.use('/api/v1', mainRouterV1);

// not found route
app.all('/{*splat}', (_req: Request, res: Response) => {
  ErrorResponse(res, StatusCodes.NOT_FOUND, 'The requested resource was not found on this server.');
});

// error handle middleware
app.use(errorHandler);

async function startServer() {
  await redis.connect();
  logger.info('🚀 Connected to Redis cache layer.');

  await prisma.$connect();
  logger.info('Connected to PostgreSQL database.');

  app.listen(env.PORT, () => {
    logger.info(
      `⚡ [Zentry IdP] Service online at http://localhost:${env.PORT} in [${env.NODE_ENV}] state.`,
    );
  });
}

// graceful shutdown
process.on('SIGINT', async () => {
  try {
    logger.info('SIGINT signal received: closing HTTP server.');
    await redis.disconnect();
    logger.info('Disconnected from high-performance Redis cache layer.');
    await prisma.$disconnect();
    logger.info('Disconnected from PostgreSQL database.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown:');
    process.exit(1);
  }
});

// Start the server
startServer().catch((err) => {
  logger.error({ err }, 'Critical service failure during initialization phase:');
  process.exit(1);
});
