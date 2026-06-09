# Repository Guidelines

## Project Structure & Module Organization

Zentry is a pnpm workspace TypeScript monorepo. Application entry points live in `apps/`: `apps/api` is the Express authentication gateway
and `apps/worker` is reserved for background Kafka/email work. Shared packages live in `packages/`: `database`
for Prisma/data access, `types` for shared contracts, and `validation` for Zod schemas. Keep reusable code in `packages/*`
and app-specific wiring in `apps/*`. Local infrastructure is in `docker-compose.yml`.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies.
- `pnpm test`: currently runs the placeholder test script and exits with an error until real tests are added.
- `pnpm --filter @zentry/api test`: run a package script for only the API app.
- `pnpm --filter @zentry/validation test`: run a package script for one shared package.
- `docker compose up -d`: start local infrastructure services defined for the project.

Add package-level `dev`, `build`, `lint`, or `typecheck` scripts as implementation lands, and expose common workspace workflows from the root.

## Coding Style & Naming Conventions

Use TypeScript ES modules (`"type": "module"`) and inherit strict settings from `tsconfig.base.json`.
The compiler enforces `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, and `noImplicitOverride`.
Prefer two-space indentation, named exports for shared utilities, PascalCase for types/classes, camelCase for functions and variables,
and lowercase package names under `@zentry/*`.

## Testing Guidelines

No test framework is configured yet. When adding one, place tests beside the code they verify or under a local `__tests__` directory, using names such as `session.test.ts` or `tenant.validation.test.ts`. Prioritize coverage for authentication flows, tenant isolation, validation schemas, database access boundaries, and worker side effects. Update the relevant `package.json` scripts so `pnpm test` becomes useful at the root.

## Commit & Pull Request Guidelines

Current history uses short imperative commits, for example `Add monorepo structure with pnpm, TypeScript configs, and Docker Compose setup`. Keep that style: start with a verb, describe the change, and avoid vague messages like `update`. Pull requests should include a summary, affected apps/packages, validation performed, linked issues when applicable, and screenshots or logs for user-visible or operational changes.

## Security & Configuration Tips

This project handles identity infrastructure, so do not commit secrets, private keys, database dumps, or real tenant data. Keep environment-specific values in local `.env` files and document required variables. Treat session, Redis, PostgreSQL, Kafka, and email changes as security-sensitive and call out migration or rollout notes in the PR.
