The correct model is: Zentry should not try to directly set cookies or localStorage inside another app’s origin.

That is the key browser rule:

- localStorage can only be written by the page running on that exact origin.
- Cookies can only be set by the response from that cookie’s domain, or a parent domain you control.
- So if the user starts on app.customer.com, authenticates at zentry.app, and then returns to app.customer.com, only app.customer.com can decide how to store that app’s session.

So the real question is not “how does Zentry set the token there?”
It is:

How does Zentry hand off proof of authentication to the consumer app safely, so that app can create its own session?

## Best practice

What you want is the standard IdP pattern:

1. User starts auth from the consumer app.
2. Consumer app sends them to Zentry with:
    - client/org identity
    - redirect_uri
    - state
    - ideally code_challenge if SPA

3. User logs in/registers at Zentry.
4. Zentry redirects back to the consumer app with a short-lived one-time code, not the real session token.
5. The consumer app exchanges that code for tokens.
6. The consumer app stores auth on its own origin.

That is basically OAuth 2.1 / OIDC Authorization Code flow, usually with PKCE.

## Why not send the token directly in the callback URL?

Because bearer tokens in URLs are high risk:

- browser history
- server logs
- analytics tools
- referrer leakage
- screenshots / copy-paste
- proxy/CDN logs

Even if it “works”, it is the wrong long-term design for an auth provider.

## What should be stored where?

There are two good patterns.

### 1. Consumer app has a backend

This is the best option.

Flow:

1. Zentry redirects back with a one-time code.
2. Consumer backend exchanges the code with Zentry.
3. Consumer backend creates its own app session.
4. Consumer backend sets its own HttpOnly, Secure, SameSite cookie.

This is the safest model because:

- the browser never sees the real long-lived token directly
- the consumer app controls session lifecycle
- fewer XSS risks

In this model, the consumer app may never need localStorage at all.

### 2. Consumer app is a pure SPA

Then use:

- authorization code + PKCE
- SPA receives the code on callback
- SPA exchanges code for token with Zentry
- SPA stores token itself

If it is truly SPA-only, you usually choose between:

- storing access token in memory only, or
- storing it in localStorage with stronger XSS precautions

This is less ideal than the backend session model, but still much better than putting the token in the redirect URL.

## Very important: Zentry cookie vs consumer app cookie

You actually have two different sessions in this architecture:

- Zentry session
  This keeps the user logged into Zentry during the auth flow.
  This can stay as a Zentry cookie on the Zentry domain.

- Consumer app session
  This is what the third-party app uses after login completes.
  This must be created by the consumer app on its own domain.

Zentry should not try to make one cookie do both jobs across different origins.

## So what should your org flow return?

Not:

- callbackUrl + token

Better:

- callbackUrl + authorizationCode
- plus state
- maybe PKCE verification support

Then the consumer app does the next step.

## If you want the simplest secure version

If you want a practical direction without fully implementing all OAuth/OIDC features at once:

1. Keep Zentry login/register UI as the central auth UI.
2. After success, generate a very short-lived one-time code tied to:
    - org
    - user
    - callback URL
    - expiration
    - optional PKCE challenge

3. Redirect to consumer callback with:
    - code
    - state

4. Consumer app exchanges code with Zentry over HTTPS.
5. Consumer app stores the final session on its own side.

That gives you the right security boundary.

## Direct answer to your question

You asked: how can I set the token in cookies and localStorage for a different web application?

Answer:

- You cannot directly set another origin’s localStorage.
- You should not directly set another origin’s cookie from Zentry.
- The other app must set its own storage after receiving a safe handoff from Zentry.
- The safe handoff should be a one-time code, not the actual bearer token.

## Recommendation

For your product, the correct long-term design is:

- Zentry acts as the identity provider
- org apps act as clients
- use Authorization Code flow
- add PKCE for browser-based clients
- let consumer apps create their own cookie/session after code exchange

If you want, next we can map your current org flow into a minimal OAuth-like design using your existing orgId, callbackUrl, and token/session model, without making it overly complex.