import axios from 'axios';
import { API_BASE_URL } from '../constants';
import type { ClientEnv } from '../env';
import { createOkResponseSchema, ZentrySessionSchema, type ZentrySessionType } from '../zod';

export interface GetServerSessionOptions {
  env: Pick<ClientEnv, 'ZENTRY_ORG_ID'>;
  token?: string;
  cookie?: string;
}

/**
 * @description This function is used to get the session
 * @returns {Promise<ZentrySessionType | null>} The session or null if not found.
 * @throws {Error} If the session is not found or if there is an error.
 * @remarks
 * Server-side code cannot read browser `localStorage`, so the caller must forward either:
 * - the user's Bearer token, or
 * - the incoming `Cookie` header
 *
 * This function uses `X-Zentry-Org-ID` as public org context and validates the user session
 * through the forwarded Bearer token or cookie.
 *
 * @example TanStack Start client hook passing the token into a server function:
 * ```tsx
 * import { createServerFn } from '@tanstack/react-start';
 * import { getServerSession } from '@zentry/sdk/react/server';
 * import { useZentry } from '@zentry/sdk/react';
 *
 * export const getCurrentSession = createServerFn({ method: 'POST' })
 *   .validator((token: string) => token)
 *   .handler(async ({ data }) => {
 *     return getServerSession({
 *       env: {
 *         ZENTRY_ORG_ID: process.env.ZENTRY_ORG_ID!,
 *       },
 *       token: data,
 *     });
 *   });
 *
 * export function SessionGate() {
 *   const { getSessionToken } = useZentry();
 *
 *   async function handleLoadSession() {
 *     const token = getSessionToken();
 *     if (!token) return null;
 *
 *     return getCurrentSession({ data: token });
 *   }
 *
 *   return <button onClick={handleLoadSession}>Load session</button>;
 * }
 * ```
 * @example Next.js Server Component using cookies:
 * ```tsx
 * import { cookies } from 'next/headers';
 * import { getServerSession } from '@zentry/sdk/react/server';
 *
 * async function fetchSession() {
 *   const cookieStore = await cookies();
 *   const session = await getServerSession({
 *     env: {
 *       ZENTRY_ORG_ID: process.env.ZENTRY_ORG_ID!,
 *     },
 *     cookie: cookieStore.toString(),
 *   });
 *
 *   if (!session) {
 *      return <div>No session found</div>;
 *   }
 *
 *   return (
 *      <div>
 *        <h1>Welcome, {session.user.firstName}!</h1>
 *      </div>
 *  );
 * }
 * ```
 * @example Server function using a Bearer token:
 * ```ts
 * import { getServerSession } from '@zentry/sdk/react/server';
 *
 * export async function loadUserSession(token: string) {
 *   return getServerSession({
 *     env: {
 *       ZENTRY_ORG_ID: process.env.ZENTRY_ORG_ID!,
 *     },
 *     token,
 *   });
 * }
 * ```
 * */
export async function getServerSession(
  options: GetServerSessionOptions,
): Promise<ZentrySessionType | null> {
  try {
    const headers: Record<string, string> = {
      'X-Zentry-Org-ID': options.env.ZENTRY_ORG_ID,
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    if (options.cookie) {
      headers.Cookie = options.cookie;
    }

    const res = await axios.get(`${API_BASE_URL}/auth/org/me`, {
      headers,
    });

    const validator = createOkResponseSchema(ZentrySessionSchema);
    const validatedData = validator.safeParse(res.data);
    if (!validatedData.success) {
      console.error('Invalid session data received from server:', validatedData.error);
      throw new Error('Invalid session data received from Zentry server.');
    }
    return validatedData.data.data;
  } catch (error) {
    console.error({
      error,
      message: 'Failed to get session',
    });
    return null;
  }
}
