import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env';
import { redis } from './lib/redis';
import { prisma } from '@zentry/database';
import mainRouterV1 from './routes';
import { errorHandler } from './middleware/errorHandler';
import { ErrorResponse } from './utils/responseHandles';
import { StatusCodes } from './utils/statusCodes';

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
  console.info('🚀 Connected to high-performance Redis cache layer.');

  await prisma.$connect();
  console.info('Connected to PostgreSQL database.');

  app.listen(env.PORT, () => {
    console.info(
      `⚡ [Zentry IdP] Service online at http://localhost:${env.PORT} in [${env.NODE_ENV}] state.`,
    );
  });
}

// graceful shutdown
process.on('SIGINT', async () => {
  try {
    console.info('SIGINT signal received: closing HTTP server.');
    await redis.disconnect();
    console.info('Disconnected from high-performance Redis cache layer.');
    await prisma.$disconnect();
    console.info('Disconnected from PostgreSQL database.');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer().catch((err) => {
  console.error('Critical service failure during initialization phase:', err);
  process.exit(1);
});
