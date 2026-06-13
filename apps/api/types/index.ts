import type { Request } from 'express';
import { Role, ProviderType } from '@zentry/database/generated/prisma/enums';

export type RequestWithAuth = Request & {
  sessionId: string; // id of the db record
  ipAddress?: string;
  user: {
    id: string;
    emailVerified: boolean;
  };
  account: {
    id: string;
    userId: string; // user id
    accountId: string; // user id or OAuth provider id
    providerType: ProviderType; // CREDENTIAL or OAUTH
  };
  org: {
    id?: string;
    permissions?: string;
    isBanned?: boolean;
    role?: Role; // ADMIN, MEMBER
  };
};
