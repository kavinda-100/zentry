# Zentry (Multi-Tenant Identity & Auth Provider)

Zentry is a production-grade, high-performance, multi-tenant Identity Provider (IdP) built as an educational blueprint for secure, 
high-throughput session topologies. It mirrors advanced patterns found in modern enterprise auth systems like Clerk, focusing heavily on 
live-revocation architecture, tenant isolation, and asynchronous message queues.

## 🚀 Architectural Pillars

1. **Stateful Session Topology ("Live-Revoke"):**
    - Opaque high-entropy tokens sent via `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
    - Central low-latency session validation powered by **Redis**.
    - Immediate privilege revocation, user banning, and active session purging without waiting for JWT expiration.
    - Database durability backed by **PostgreSQL** via **Prisma ORM**.

2. **Tenant & Organization Isolation:**
    - Soft-partitioned multi-tenancy using explicit organizational discriminator columns.
    - Role-Based Access Control (RBAC) dynamically fetched and mapped in the session payload.

3. **Asynchronous Event-Driven Processing:**
    - Non-blocking execution lines using **Kafka** to handle heavy secondary actions.
    - Separate background workers for transactional workflows via **React Email** and **Nodemailer**.

## 🛠️ Tech Stack & Workspace Blueprint

- **Package Manager:** `pnpm` Workspaces (Monorepo)
- **Languages:** TypeScript
- **Runtime & Gateway:** Node.js + Express.js
- **Cache & Session Layer:** Redis
- **Message Broker:** Apache Kafka
- **Database Layer:** PostgreSQL + Prisma ORM
- **Validation:** Zod
- **Email Pipeline:** React Email + Nodemailer
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Other:** tsx, eslint, prettier,

## 📁 Repository Structure

```text
zentry/
├── apps/
│   ├── api/                 # Express.js Authentication Server / Gateway
│   └── worker/              # Background worker for Kafka consumers (Emails, logs)
├── packages/
│   ├── database/            # Prisma ORM Schema & Client Wrapper
│   ├── types/               # Shared types
│   └── validation/          # Shared Zod schemas (Auth requests, Org creation)
├── pnpm-workspace.yaml      # Monorepo configuration
├── package.json             # Root package definition
├── tsconfig.base.json       # Root typescript configuration
├── docker-compose.yml       # Docker Compose configuration
├── README.md                # Project Blueprint & Architecture Map
└── AGENT.md                 # Agentic workflow rules and execution context
```