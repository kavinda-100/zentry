import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env';
import { redis } from './lib/redis';
import { prisma } from '@zentry/database';
import mainRouter from './routes';

const app = express();

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
app.use('/api/v1', mainRouter);

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

startServer().catch((err) => {
  console.error('Critical service failure during initialization phase:', err);
  process.exit(1);
});
