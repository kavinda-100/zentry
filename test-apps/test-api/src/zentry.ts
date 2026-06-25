import { ZentryClient } from '@zentry-org/sdk/node';
import 'dotenv/config';

export const zentry = new ZentryClient({
  orgId: process.env.ZENTRY_ORG_ID!,
  apiKey: process.env.ZENTRY_API_KEY!,
});
