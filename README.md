# Zentry

Zentry is a multi-tenant authentication platform built in a `pnpm` TypeScript monorepo. The current product surface includes the core auth API, the hosted web app, the background worker, and the SDK used by client apps and backend services.

## What I Have Built

- `apps/api`: the authentication API and session gateway
- `apps/web`: the hosted Zentry web app for auth flows, organization management, and docs
- `apps/worker`: the background worker for async email and event-driven jobs
- `packages/sdk`: the integration SDK for React apps and Node backends

SDK details live in [packages/sdk/README.md](./packages/sdk/README.md).

## Auth Strategies

Zentry currently supports:

- email + password authentication
- Google OAuth
- email verification with OTP
- organization-scoped hosted auth with redirect `code + state` exchange
- stateful session validation with Redis-backed live revocation
- cookie-based sessions for web clients and bearer-token support for API consumers

## Technologies

- TypeScript
- Node.js
- Express
- TanStack Start
- React
- PostgreSQL
- Prisma ORM
- Redis
- Kafka
- Zod
- React Email
- Nodemailer
- Docker Compose
- pnpm workspaces

## Repository Structure

```text
zentry/
├── apps/
│   ├── api/
│   ├── web/
│   └── worker/
├── packages/
│   ├── database/
│   ├── sdk/
│   ├── types/
│   └── validation/
└── test-apps/
    ├── test-api/
    └── test-ui/
```

## Development

```bash
pnpm install
docker compose up -d
pnpm dev
```

Useful commands:

- `pnpm dev`: run the workspace apps in development
- `pnpm dev:test`: run the SDK test apps
- `pnpm build`: build shared packages and apps
- `pnpm db:generate`: generate Prisma client
- `pnpm db:push`: push the current schema

## Notes

- `test-apps/test-ui` and `test-apps/test-api` are used to validate the SDK and end-to-end auth integration flows.
- Root-level automated tests are not fully wired yet, so current validation is mainly through the running apps, Postman, and the test apps.
