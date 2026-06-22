import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL, SESSION_TOKEN, ZENTRY_UI_BASE_URL } from '../constants';
import type { ClientEnv } from '../env';
import { createOkResponseSchema, ZentrySessionSchema, type ZentrySessionType } from '../zod';

interface ZentryContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: ZentrySessionType | null;
  register: () => void;
  login: () => void;
  logout: () => Promise<void>;
  getSessionToken: () => string | null;
}

export interface ZentryProviderProps {
  children: ReactNode;
  env: Pick<ClientEnv, 'ZENTRY_ORG_ID' | 'ZENTRY_APP_CALLBACK_URL'>;
}

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
          'X-Zentry-Org-ID': env.ZENTRY_ORG_ID,
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
    window.location.href = `${ZENTRY_UI_BASE_URL}/org/register?callbackUrl=${encodeURIComponent(env.ZENTRY_APP_CALLBACK_URL)}`;
  };

  // Redirect to Zentry UI if not authenticated
  const login = () => {
    window.location.href = `${ZENTRY_UI_BASE_URL}/org/login?callbackUrl=${encodeURIComponent(env.ZENTRY_APP_CALLBACK_URL)}`;
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
            'X-Zentry-Org-ID': env.ZENTRY_ORG_ID,
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
      value={{ isAuthenticated, isLoading, session, login, logout, register, getSessionToken }}
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
 * Automatically captures, stores, and purges the token from the URL params.
 */
export function useZentryCallbackSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem(SESSION_TOKEN, token);
      // Clean up the URL bar instantly
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      window.location.reload(); // Re-trigger initial hook verification
    }
  }, []);
}
