import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './lib/env';
import { PrismaClient } from './generated/prisma/client';

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
