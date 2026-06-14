import type { SessionObjectSchemaType } from '@zentry/validation/src/auth';

declare global {
  namespace Express {
    interface Request extends SessionObjectSchemaType {
      token: string;
    }
  }
}

export {};
