import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import {
  API_BASE_URL,
  ORG_ID_HEADER,
  PENDING_AUTH_STATE,
  SESSION_TOKEN,
  ZENTRY_UI_BASE_URL,
} from '../constants';
import type { ClientEnv } from '../env';
import {
  createOkResponseSchema,
  orgAuthExchangeResponseSchema,
  orgSdkCallbackQuerySchema,
  ZentrySessionSchema,
  type ZentrySessionType,
} from '../zod';

interface ZentryContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: ZentrySessionType | null;
  register: () => void;
  login: () => void;
  logout: () => Promise<void>;
  getSessionToken: () => string | null;
  refreshSession: () => Promise<void>;
}

export interface ZentryCallbackSyncResult {
  success: boolean;
  isLoading: boolean;
  message: string | null;
}

export interface ZentryProviderProps {
  children: ReactNode;
  env: Pick<ClientEnv, 'ZENTRY_ORG_ID' | 'ZENTRY_APP_CALLBACK_URL'>;
}

type PendingAuthStateRecord = {
  state: string;
  orgId: string;
  callbackUrl: string;
};

const getActiveToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(SESSION_TOKEN);
  if (typeof token !== 'string') {
    console.error('No active token found or token is not a string');
    return null;
  }
  return token;
};

const removeItemFromLocalStorage = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

/**
 * @description Creates a cryptographically strong state value for redirect integrity checks.
 */
const createAuthState = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.crypto.randomUUID() + window.crypto.randomUUID();
};

/**
 * @description Persists the pending redirect state for one callback round-trip.
 */
const storePendingAuthState = (record: PendingAuthStateRecord) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_AUTH_STATE, JSON.stringify(record));
};

/**
 * @description Reads the pending redirect state expected on the callback page.
 */
const getPendingAuthState = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(PENDING_AUTH_STATE);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingAuthStateRecord;
    if (
      typeof parsed.state !== 'string' ||
      typeof parsed.orgId !== 'string' ||
      typeof parsed.callbackUrl !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/**
 * @description Clears the pending redirect state after the callback is processed.
 */
const clearPendingAuthState = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_AUTH_STATE);
};

/**
 * @description Parses and validates the code and state returned on the callback URL.
 */
const getCallbackCodeAndStateFromUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const parsed = orgSdkCallbackQuerySchema.safeParse({
    code: params.get('code'),
    state: params.get('state'),
  });

  return parsed.success ? parsed.data : null;
};

/**
 * @description Removes transient callback query params from the browser URL bar.
 */
const clearCallbackParamsFromUrl = () => {
  if (typeof window === 'undefined') return;
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
};

const ZentryContext = createContext<ZentryContextType | undefined>(undefined);

export function ZentryProvider({ children, env }: ZentryProviderProps) {
  const [session, setSession] = useState<ZentrySessionType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = async () => {
    const activeToken = getActiveToken();
    if (!activeToken) {
      setIsLoading(false);
      console.log('No active token found, skipping session sync');
      return;
    }

    try {
      // Validate token against your central Zentry server
      const res = await axios.get(`${API_BASE_URL}/auth/org/me`, {
        headers: {
          [ORG_ID_HEADER]: env.ZENTRY_ORG_ID,
          Authorization: `Bearer ${activeToken}`,
        },
      });

      // validate the data
      const validator = createOkResponseSchema(ZentrySessionSchema);
      const validatedData = validator.safeParse(res.data);
      if (!validatedData.success) {
        console.error('Invalid session data received from server:', validatedData.error);
        throw new Error('Invalid session data received from Zentry server.');
      }
      setSession(validatedData.data.data);
      setIsAuthenticated(true);
    } catch {
      removeItemFromLocalStorage(SESSION_TOKEN);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncSession()
      .then(() => {
        console.log('Session synced');
      })
      .catch((error) => {
        console.error('Error syncing session:', error);
      });
  }, []);

  // Redirect to Zentry UI if not authenticated
  const register = () => {
    const state = createAuthState();
    storePendingAuthState({
      state,
      orgId: env.ZENTRY_ORG_ID,
      callbackUrl: env.ZENTRY_APP_CALLBACK_URL,
    });
    const url = new URL(`${ZENTRY_UI_BASE_URL}/org/register`);
    url.searchParams.set('callbackUrl', env.ZENTRY_APP_CALLBACK_URL);
    url.searchParams.set('orgId', env.ZENTRY_ORG_ID);
    url.searchParams.set('state', state);
    window.location.href = url.toString();
  };

  // Redirect to Zentry UI if not authenticated
  const login = () => {
    const state = createAuthState();
    storePendingAuthState({
      state,
      orgId: env.ZENTRY_ORG_ID,
      callbackUrl: env.ZENTRY_APP_CALLBACK_URL,
    });
    const url = new URL(`${ZENTRY_UI_BASE_URL}/org/login`);
    url.searchParams.set('callbackUrl', env.ZENTRY_APP_CALLBACK_URL);
    url.searchParams.set('orgId', env.ZENTRY_ORG_ID);
    url.searchParams.set('state', state);
    window.location.href = url.toString();
  };

  // Logout function
  const logout = async () => {
    try {
      const activeToken = getActiveToken();
      if (!activeToken) {
        console.error('No active token found, skipping logout');
        return;
      }
      await axios.post(
        `${API_BASE_URL}/auth/org/logout`,
        {},
        {
          headers: {
            [ORG_ID_HEADER]: env.ZENTRY_ORG_ID,
            Authorization: `Bearer ${activeToken}`,
          },
        },
      );
      removeItemFromLocalStorage(SESSION_TOKEN);
      setSession(null);
      setIsAuthenticated(false);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getSessionToken = () => {
    return getActiveToken();
  };

  return (
    <ZentryContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        session,
        login,
        logout,
        register,
        getSessionToken,
        refreshSession: syncSession,
      }}
    >
      {children}
    </ZentryContext.Provider>
  );
}

export function useZentry() {
  const context = useContext(ZentryContext);
  if (!context) throw new Error('useZentry must be nested within a ZentryProvider');
  return context;
}

/**
 * Automatically exchanges the callback code, stores the final token, and purges transient URL params.
 */
export function useZentryCallbackSync() {
  const context = useContext(ZentryContext);
  const [result, setResult] = useState<ZentryCallbackSyncResult>({
    success: false,
    isLoading: true,
    message: null,
  });

  if (!context) throw new Error('useZentryCallbackSync must be nested within a ZentryProvider');

  useEffect(() => {
    const syncCallback = async () => {
      if (typeof window === 'undefined') {
        setResult({
          success: false,
          isLoading: false,
          message: 'Callback sync is only available in the browser.',
        });
        return;
      }

      const callbackParams = getCallbackCodeAndStateFromUrl();
      if (!callbackParams) {
        setResult({
          success: false,
          isLoading: false,
          message: 'Missing callback code or state in the URL.',
        });
        return;
      }

      const pendingState = getPendingAuthState();
      if (!pendingState || pendingState.state !== callbackParams.state) {
        clearPendingAuthState();
        clearCallbackParamsFromUrl();
        const message = 'Invalid or missing auth state during callback processing.';
        console.error(message);
        setResult({
          success: false,
          isLoading: false,
          message,
        });
        return;
      }

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/org/exchange`,
          {
            code: callbackParams.code,
            callbackUrl: pendingState.callbackUrl,
            state: callbackParams.state,
          },
          {
            headers: {
              [ORG_ID_HEADER]: pendingState.orgId,
            },
          },
        );

        const validator = createOkResponseSchema(orgAuthExchangeResponseSchema);
        const validatedData = validator.safeParse(res.data);
        if (!validatedData.success) {
          console.error('Invalid exchange response received from server:', validatedData.error);
          throw new Error('Invalid exchange response received from Zentry server.');
        }

        localStorage.setItem(SESSION_TOKEN, validatedData.data.data.session.token);
        await context.refreshSession();
        clearPendingAuthState();
        clearCallbackParamsFromUrl();
        setResult({
          success: true,
          isLoading: false,
          message: 'Token exchange completed successfully.',
        });
      } catch (error) {
        clearPendingAuthState();
        clearCallbackParamsFromUrl();
        console.error('Error exchanging callback code:', error);
        setResult({
          success: false,
          isLoading: false,
          message: 'Failed to exchange callback code.',
        });
      }
    };

    syncCallback()
      .then(() => {
        console.log('Callback synced');
      })
      .catch((error) => {
        console.error('Error syncing callback:', error);
      });
  }, []);

  return result;
}
