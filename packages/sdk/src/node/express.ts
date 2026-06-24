import type { ZentrySessionType } from '../zod';

declare global {
  namespace Express {
    interface Request {
      zentry?: ZentrySessionType;
    }
  }
}

export {};
