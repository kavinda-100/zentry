import { queryOptions, type QueryClient } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { isAuthenticatedSchema } from '#/zod/auth';
import { ORG_AUTH_VERIFICATION_FLOW_KEY, SESSION_TOKEN_KEY } from '#/constants';
import { getItemFromLocalStorage, setItemToLocalStorage } from '#/hooks/useLocalStorage.ts';

export function getStoredSessionToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedToken = getItemFromLocalStorage<unknown>(SESSION_TOKEN_KEY);
    return typeof storedToken === 'string' ? storedToken : null;
  } catch {
    return null;
  }
}

export function storeSessionToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  setItemToLocalStorage(SESSION_TOKEN_KEY, token);
}

export function buildCallbackUrlWithCode(callbackUrl: string, code: string, state: string) {
  const redirectUrl = new URL(callbackUrl);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);
  return redirectUrl.toString();
}

/**
 * @description Stores the temporary verification flow id for the hosted org auth UI.
 */
export function storeOrgVerificationFlow(verificationFlowId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ORG_AUTH_VERIFICATION_FLOW_KEY, verificationFlowId);
}

/**
 * @description Reads the temporary verification flow id for the hosted org auth UI.
 */
export function getStoredOrgVerificationFlow() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(ORG_AUTH_VERIFICATION_FLOW_KEY);
}

/**
 * @description Clears the temporary verification flow id after the hosted org auth flow completes.
 */
export function clearStoredOrgVerificationFlow() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ORG_AUTH_VERIFICATION_FLOW_KEY);
}

export const getIsAuthenticatedQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['isAuthenticated', token],
    queryFn: async () => {
      const response = await api.get('/auth/is-authenticated');
      const validator = createOkResponseSchema(isAuthenticatedSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

export async function getIsAuthenticated(queryClient: QueryClient): Promise<boolean> {
  const token = getStoredSessionToken();

  if (!token) {
    return false;
  }

  try {
    const data = await queryClient.fetchQuery(getIsAuthenticatedQueryOptions(token));
    return data.data.isAuthenticated;
  } catch {
    return false;
  }
}
