import { ZentryProvider } from '@zentry-org/sdk/react';
import * as React from 'react';

export function ZentryProviders({ children }: { children: React.ReactNode }) {
  return (
    <ZentryProvider
      // env={{
      //   ZENTRY_ORG_ID: import.meta.env.VITE_ZENTRY_ORG_ID,
      //   ZENTRY_APP_CALLBACK_URL:
      //     import.meta.env.VITE_ZENTRY_APP_CALLBACK_URL ?? `${window.location.origin}/callback`,
      // }}
      env={{
        ZENTRY_ORG_ID: 'a3fe5953-17b4-4d32-ab8a-870d76f9a112',
        ZENTRY_APP_CALLBACK_URL: 'http://localhost:5173/callback',
      }}
    >
      {children}
    </ZentryProvider>
  );
}
