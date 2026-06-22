# `@zentry/sdk`

Zentry SDK for frontend apps and backend APIs.

This package supports two integration layers:

- `@zentry/sdk/react` for browser apps such as Vite + React, Next.js, and TanStack Start
- `@zentry/sdk/node` for backend APIs such as Express

Both layers use the same normalized session payload: `ZentrySessionType`.

## How Zentry Works

Zentry separates:

- organization identity
- end-user identity

For a request to be treated as an authenticated user request inside an organization:

1. the frontend authenticates the user with Zentry
2. Zentry issues a user session token
3. the frontend stores that token in `localStorage`
4. the frontend sends the token on requests to the developer's backend API
5. the backend validates that user token against Zentry using:
   - the forwarded user token
   - the organization's `orgId`
   - the organization's secret `apiKey`
6. Zentry returns the validated session in the shared `ZentrySessionType` shape

The backend never identifies a user from `orgId` and `apiKey` alone. Those values identify the organization and application. The user token identifies the signed-in user.

## Shared Session Shape

The React SDK and Node SDK both work with the same session structure from [`src/zod.ts`](./src/zod.ts):

- `user`
- `org`
- `membership`
- `account`

Backend middleware attaches this payload to:

```ts
req.zentry
```

Type:

```ts
import type { ZentrySessionType } from '@zentry/sdk/react';
```

## Installation

```bash
pnpm add @zentry/sdk
```

Peer dependencies:

- `react` for the React SDK
- `express` for the Node SDK

## React Setup

Use the React SDK in your frontend application to:

- redirect users to Zentry login/register
- sync the current session from Zentry
- access the authenticated session in React
- capture the callback token returned by Zentry
- use built-in unstyled auth components if you do not want to wire the buttons yourself

Note on framework examples:

- GitHub-flavored Markdown does not support real tabs natively
- for a package README, plain sections are the most portable option
- if you want, this can later be converted into HTML-based tabs for a docs site

### Required frontend env

The React SDK expects:

```env
ZENTRY_ORG_ID=your-org-id
ZENTRY_APP_CALLBACK_URL=http://localhost:3000/auth/callback
```

Notes:

- `ZENTRY_ORG_ID` identifies the organization context
- `ZENTRY_APP_CALLBACK_URL` is the frontend route Zentry redirects back to after login/register
- the SDK uses its internal fixed Zentry API base URL constant

### Built-in React components

The SDK already exports raw, unstyled HTML components.

- `RegisterButton`
- `LoginButton`
- `LogoutButton`
- `Authenticated`
- `UnAuthenticated`

These are intentionally unstyled so each app can theme them however it wants.

Example:

```tsx
import {
  Authenticated,
  LoginButton,
  LogoutButton,
  RegisterButton,
  UnAuthenticated,
} from '@zentry/sdk/react';

export function AuthActions() {
  return (
    <>
      <UnAuthenticated>
        <RegisterButton className="btn btn-secondary" />
        <LoginButton className="btn btn-primary" />
      </UnAuthenticated>

      <Authenticated>
        <LogoutButton className="btn btn-danger" label="Sign out" />
      </Authenticated>
    </>
  );
}
```

### Framework examples

### Vite + React

Wrap your root app with `ZentryProvider`:

```tsx
import { ZentryProvider } from '@zentry/sdk/react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ZentryProvider
      env={{
        ZENTRY_ORG_ID: import.meta.env.VITE_ZENTRY_ORG_ID,
        ZENTRY_APP_CALLBACK_URL: `${window.location.origin}/auth/callback`,
      }}
    >
      {children}
    </ZentryProvider>
  );
}
```

Then mount it in `src/main.tsx`:
```tsx
import { AppProviders } from './AppProviders';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <AppProviders>
      <App />
    </AppProviders>
);

```

Use the callback hook on your callback route:

```tsx
import { useZentryCallbackSync } from '@zentry/sdk/react';

export default function AuthCallbackPage() {
  useZentryCallbackSync();
  return <div>Signing you in...</div>;
}
```

### TanStack Start

TanStack Start apps typically mount shared providers inside the root route shell. 
In a setup like `your-app/src/routes/__root.tsx`,
add `ZentryProvider` inside the `RootDocument` body alongside your other app-wide providers.

```tsx
import * as React from 'react';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { ZentryProvider } from '@zentry/sdk/react';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
         <ZentryProvider env={{
             ZENTRY_ORG_ID: import.meta.env.VITE_ZENTRY_ORG_ID,
             ZENTRY_APP_CALLBACK_URL: `${window.location.origin}/auth/callback`,
         }}
         >
            {children}
         </ZentryProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

Example callback page:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useZentryCallbackSync } from '@zentry/sdk/react';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
   useZentryCallbackSync();
   return <div>Signing you in...</div>;
}
```

Example server-side session lookup:

```ts
import { createServerFn } from '@tanstack/react-start';
import { getServerSession } from '@zentry/sdk/react-server';

export const getCurrentSession = createServerFn({ method: 'POST' })
  .validator((token: string) => token)
  .handler(async ({ data }) => {
    return getServerSession({
      env: {
        ZENTRY_ORG_ID: process.env.ZENTRY_ORG_ID!,
      },
      token: data,
    });
  });
```

### Next.js

Wrap your client-side provider in a client component:

```tsx
'use client';

import type { ReactNode } from 'react';
import { ZentryProvider } from '@zentry/sdk/react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ZentryProvider
      env={{
        ZENTRY_ORG_ID: process.env.NEXT_PUBLIC_ZENTRY_ORG_ID!,
        ZENTRY_APP_CALLBACK_URL: `${process.env.NEXT_PUBLIC_APP_URL!}/auth/callback`,
      }}
    >
      {children}
    </ZentryProvider>
  );
}
```

Mount it in `app/layout.tsx` or `src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Callback page example:

```tsx
'use client';

import { useZentryCallbackSync } from '@zentry/sdk/react';

export default function AuthCallbackPage() {
  useZentryCallbackSync();
  return <div>Signing you in...</div>;
}
```

Server component session lookup example:

```tsx
import { cookies } from 'next/headers';
import { getServerSession } from '@zentry/sdk/react-server';

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const session = await getServerSession({
    env: {
      ZENTRY_ORG_ID: process.env.NEXT_PUBLIC_ZENTRY_ORG_ID!,
    },
    cookie: cookieStore.toString(),
  });

  if (!session) {
    return <div>No session found</div>;
  }

  return <div>Welcome {session.user.firstName}</div>;
}
```

### Read auth state

```tsx
import { useZentry, LogoutButton} from '@zentry/sdk/react';

export function Profile() {
  const { session, isAuthenticated, isLoading } = useZentry();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) {
    return (
      <div>
        <p>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div>
      <p>User ID: {session?.user.id}</p>
      <p>Org ID: {session?.org.id}</p>
      <p>Role: {session?.membership.role}</p>
      <LogoutButton label="Sign out" />
    </div>
  );
}
```

### Capture the callback token

When Zentry redirects back to your app, the token is returned in the URL. Use `useZentryCallbackSync()` on the callback page to:

- read the token from the query string
- store it in `localStorage`
- clear it from the URL
- reload the app so session sync runs again

```tsx
import { useZentryCallbackSync } from '@zentry/sdk/react';

export default function AuthCallbackPage() {
  useZentryCallbackSync();

  return <div>Signing you in...</div>;
}
```

### Frontend request forwarding

When your frontend calls your own backend API, forward the Zentry token:

```tsx
import axios from 'axios';
import { useZentry } from '@zentry/sdk/react';

export function ExampleButton() {
  const { getSessionToken } = useZentry();

  async function handleClick() {
    const token = getSessionToken();
    if (!token) return;

    // Forward the token to the backend API when making requests
    await axios.get('/api/v1/*', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return <button onClick={handleClick}>Call API</button>;
}
```

You can isolate the token attachment logic from the UI. (only work in browser environments, for server environments use the `getServerSession` helper described below)
```ts
import { useZentry } from '@zentry/sdk/react';
import axios from 'axios';

export const api = axios.create({
   baseURL: 'your-api-url',
   withCredentials: true,
   headers: {
     'Content-Type': 'application/json',
   },
})

api.interceptors.request.use((config) => {
   if (typeof window !== 'undefined') {
       const { getSessionToken } = useZentry();
      const storedToken = getSessionToken();

      if (storedToken) {
         config.headers = axios.AxiosHeaders.from(config.headers);
         config.headers.set('Authorization', `Bearer ${storedToken}`);
      }
   }

   return config;
});
```

This is the current integration model: the frontend forwards the user session token stored in `localStorage` to the developer's backend API on each authenticated request.

## React Server Session Helper

For server-side React code, use the server helper when you need to validate a forwarded token or incoming cookie against Zentry.

Import path:

```ts
import { getServerSession } from '@zentry/sdk/react-server';
```

Example:

```ts
import { getServerSession } from '@zentry/sdk/react-server';

export async function loadSession(token: string) {
  return getServerSession({
    env: {
      ZENTRY_ORG_ID: process.env.ZENTRY_ORG_ID!,
    },
    token,
  });
}
```

## Node / Express Setup

Use the Node SDK in the developer's backend API to validate the forwarded user token with Zentry.

### Required backend env

```env
ZENTRY_ORG_ID=your-org-id
ZENTRY_API_KEY_RAW=your-org-api-key
```

Notes:

- `ZENTRY_ORG_ID` identifies the organization
- `ZENTRY_API_KEY_RAW` is the secret API key for the organization
- the Node SDK uses the internal fixed Zentry API base URL constant

### Create the client

```ts
import { ZentryClient } from '@zentry/sdk/node';

export const zentry = new ZentryClient({
  orgId: process.env.ZENTRY_ORG_ID!,
  apiKey: process.env.ZENTRY_API_KEY_RAW!,
});
```

### Protect routes with `requireUser()`

`requireUser()`:

- reads the incoming bearer token from the developer API request
- calls Zentry to validate the token for the configured org
- validates the response shape
- attaches the session to `req.zentry`

```ts
import express from 'express';
import { zentry } from './zentry';

const app = express();

app.get('/api/me', zentry.requireUser(), (req, res) => {
  res.json({
    session: req.zentry,
    userId: req.zentry?.user.id,
    orgId: req.zentry?.org.id,
    role: req.zentry?.membership.role,
  });
});
```

### Use `requireOrg()`

`requireOrg()` is a lightweight middleware that confirms the SDK instance is configured with valid org credentials before continuing.

```ts
app.use(zentry.requireOrg());
```

In the current version it does not perform a remote org verification request by itself.

## End-to-End Flow

### Browser flow

1. frontend renders inside `ZentryProvider`
2. user clicks `login()` or `register()`
3. user is redirected to the Zentry UI
4. after success, Zentry redirects back to the app callback URL with a token
5. callback page stores that token in `localStorage`
6. the provider calls Zentry to fetch the full session in `ZentrySessionType` shape
7. React code uses `useZentry()` to read auth state

### Backend flow

1. frontend sends `Authorization: Bearer <token>` to the developer API
2. Express route uses `zentry.requireUser()`
3. the SDK sends a request to Zentry with:
   - the user token in `Authorization`
   - the org ID header
   - the org API key header
4. Zentry validates:
   - organization identity
   - API key
   - user session token
   - organization membership
5. Zentry returns the normalized session payload
6. the SDK attaches the payload to `req.zentry`
7. the route handler uses `req.zentry`

## Headers Used Internally

The SDK uses these shared header constants:

- `X-Zentry-Org-ID`
- `X-Zentry-API-Key`

Frontend apps usually only send the organization header to Zentry directly.

Backend apps send:

- `Authorization: Bearer <user_token>`
- `X-Zentry-Org-ID`
- `X-Zentry-API-Key`

## Summary

Use:

- `@zentry/sdk/react` in the UI
- `@zentry/sdk/react-server` for server-side React helpers
- `@zentry/sdk/node` in the backend API

The UI owns login and token capture.

The backend owns secure user validation against Zentry.

Both consume the same `ZentrySessionType`, which keeps frontend and backend auth handling aligned.
