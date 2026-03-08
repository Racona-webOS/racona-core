<p align="center">
  <img src="https://elyos.hu/logo.png" alt="ElyOS Logo" width="120" />
</p>

<!-- <h1 align="center">ElyOS</h1> -->

<p align="center">
  A full desktop experience built with web technologies. Open source, free, and accessible from anywhere.
</p>

<p align="center">
  <!-- <a href="https://www.npmjs.com/package/@elyos/sdk"><img src="https://img.shields.io/npm/v/@elyos/sdk?label=%40elyos%2Fsdk&color=blue" alt="npm version" /></a>
  <a href="https://hub.docker.com/r/elyos/core"><img src="https://img.shields.io/docker/pulls/elyos/core" alt="Docker pulls" /></a>
  <a href="https://github.com/elyos/core/actions"><img src="https://img.shields.io/github/actions/workflow/status/elyos/core/ci.yml?branch=main&label=CI" alt="CI status" /></a>-->
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
  <a href="https://github.com/ElyOS-webOS/elyos-core/releases"><img src="https://img.shields.io/github/package-json/v/ElyOS-webOS/elyos-core" alt="Version" /></a>
</p>

<p align="center">
  <a href="https://elyos.hu">Website</a> · <a href="https://docs.elyos.hu/en/">Documentation (user)</a> ·<!-- <a href="./docs/PLUGIN_DEVELOPMENT.md">Plugin Development</a> ·--> <a href="./docs/CONTRIBUTING.md">Contributing</a> · <a href="./docs/TROUBLESHOOTING.md">Troubleshooting</a> · <a href="./README_HU.md">🇭🇺 Magyar</a>
</p>

---

<!-- Screenshot placeholder -->
<!-- <p align="center"><img src="https://elyos.hu/screenshots/desktop.png" alt="ElyOS Desktop" width="800" /></p> -->

> **Note:** Code comments in this codebase may be written in Hungarian, but all code — variable names, function names, UI strings, and other identifiers — is in English.

## Table of Contents

- [What is ElyOS?](#what-is-elyos)
- [Features](#features)
- [Built-in Applications](#built-in-applications)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Using Docker (recommended)](#using-docker-recommended)
  - [Default admin account](#default-admin-account)
  - [Local Development](#local-development)
  - [Common Commands](#common-commands)
- [Project Structure](#project-structure)
- [Docker](#docker)
- [Plugin Development](#plugin-development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

## What is ElyOS?

ElyOS combines the functionality of a traditional desktop OS with the flexibility of modern web technologies. Users access a full desktop environment — window management, taskbar, start menu, desktop shortcuts, context menus — entirely through the browser.

It's modular and extensible: build your own apps as plugins using the SDK, or self-host the entire platform with Docker.

## Features

- **Window Management** — drag, resize, minimize, maximize, snap
- **Taskbar & Start Menu** — customizable position, grid/list view, search
- **Desktop Shortcuts** — drag-and-drop, right-click context menu
- **Plugin System** — install third-party apps or build your own with `@elyos/sdk`
- **Authentication** — email/password, email OTP, Google sign-in, 2FA (TOTP)
- **Internationalization** — database-backed i18n with runtime locale switching
- **Real-time Chat** — built-in messaging via Socket.IO
- **Dark/Light Mode** — system-aware theme switching
- **Self-hostable** — single Docker Compose command to run everything

## Built-in Applications

| App            | Description                             |
| -------------- | --------------------------------------- |
| Settings       | Appearance, security, language, desktop |
| Users          | Account, group, and role management     |
| Log            | System and error log viewer             |
| Plugin Manager | Upload and install plugins              |
| Chat           | Real-time internal messaging            |
| Notifications  | System notification management          |
| Help           | Built-in documentation browser          |

## Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Frontend       | SvelteKit 2, Svelte 5, TypeScript 5, Tailwind CSS 4 |
| Backend        | SvelteKit server, Express + Socket.IO               |
| Database       | PostgreSQL via Drizzle ORM                          |
| Auth           | better-auth (email, OTP, Google, 2FA)               |
| Runtime        | Bun                                                 |
| Infrastructure | Docker + Docker Compose                             |
| Testing        | Vitest, fast-check, Playwright                      |

## Quick Start

### Prerequisites

- [Docker](https://docker.com) and Docker Compose — required
  > **Recommended for macOS users:** Consider using [OrbStack](https://orbstack.dev) instead of Docker Desktop. OrbStack offers significantly faster container and VM startup, uses a fraction of the memory and CPU, integrates natively with macOS Keychain, and has a much smaller app footprint. It's also free for personal use.
- [Bun](https://bun.sh) (v1.0+) — optional, needed for the convenience `bun docker:*` commands; the system can be started without Bun using raw Docker commands directly

### Environment Configuration

> **This is a critical step. Skipping or misconfiguring it will cause features to break.**

Before starting the system, copy the example file and fill in the values:

```bash
cp .env.example .env
```

The `.env.example` file is fully documented — read through it carefully. Key things to configure:

| Variable                                    | Required                | Effect if missing or incorrect                                                                              |
| ------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                        | Always                  | Auth tokens cannot be signed — login breaks in every environment                                            |
| `APP_URL` / `ORIGIN`                        | Always                  | SvelteKit CSRF protection blocks all server actions (remote functions return 403), and auth callbacks break |
| `DATABASE_URL`                              | Always                  | App cannot connect to the database                                                                          |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Only for Google login   | Google sign-in will not work                                                                                |
| `SMTP_*` / `RESEND_API_KEY` / etc.          | Only for email features | Email verification, OTP (one time password), and password reset will not work                               |
| `ADMIN_USER_EMAIL`                          | Recommended             | Admin account will use the default email from seed data                                                     |

Every feature that depends on a missing or incorrect variable will silently fail or return an error. **Read the `.env.example` comments before starting.**

### Using Docker (recommended)

This method creates a fully self-contained, runnable system in Docker containers. Both ElyOS and the database run in containers, so **no local Node.js, Bun, or PostgreSQL installation is required** — Docker is all you need.

**With Bun (if installed):**

```bash
# Clone the repository
git clone https://github.com/ElyOS-webOS/elyos-core
cd elyos-core

# Copy and configure environment variables (see section above)
cp .env.example .env

# Start ElyOS + PostgreSQL
bun docker:up

# Open in browser
open http://localhost:3000
```

**Without Bun (Docker only):**

```bash
# Clone the repository
git clone https://github.com/ElyOS-webOS/elyos-core
cd elyos-core

# Copy and configure environment variables (see section above)
cp .env.example .env

# Start ElyOS + PostgreSQL
docker compose -f docker/docker-compose.yml up -d

# Open in browser
open http://localhost:3000
```

### Default admin account

After the first startup, the system comes with a pre-configured administrator user with full access.

- **Email:** the value of `ADMIN_USER_EMAIL` set in your `.env` file
- **Password:** `Admin123.`

> **Important:** Change this password immediately after your first login via **Settings → Security**.

### Local Development

```bash
# Install dependencies
bun install

# Copy and configure environment variables (see section above)
cp .env.example .env

# Start PostgreSQL
bun docker:db

# Initialize database (generate + migrate + seed)
bun db:init

# Start dev server
bun app:dev
```

The app will be available at `http://localhost:5173`.

### Common Commands

```bash
bun app:dev           # Start dev server
bun app:build         # Production build
bun app:check         # Type checking (svelte-check + tsc)

bun db:generate       # Generate migrations from schema changes
bun db:migrate        # Run pending migrations
bun db:studio         # Open Drizzle Studio
bun db:seed           # Seed database
bun db:reset          # Reset database

bun docker:up         # Start Docker containers
bun docker:down       # Stop Docker containers
bun docker:logs       # Follow container logs
bun docker:db         # Start only PostgreSQL (for local development)

bun test              # Run all tests (from apps/web)
bun lint              # Lint check
bun format            # Format code
```

## Project Structure

```
elyos-core/
├── apps/web/                     # Main SvelteKit application
│   └── src/
│       ├── routes/               # File-based routing
│       ├── apps/                 # Built-in desktop applications
│       └── lib/                  # Shared libraries, components, stores
├── packages/
│   ├── database/                 # Drizzle ORM schemas, migrations, seeds
│   ├── sdk/                      # @elyos/sdk — plugin SDK (npm)
│   └── create-elyos-plugin/      # CLI tool for scaffolding plugins (npm)
├── examples/plugins/             # Example plugin implementations
├── docker/                       # Dockerfile and docker-compose.yml
├── docs/                         # Documentation
└── .github/                      # CI/CD workflows, issue/PR templates
```

## Docker

### Self-hosting

```bash
bun docker:up
```

This starts the full system in three containers, in order:

1. **postgres** — PostgreSQL 18 database (custom image with `postgres-json-schema` extension)
2. **db-init** — one-time initialization: Drizzle migrations + seed data (only starts once postgres is healthy)
3. **elyos** — the application itself (only starts after db-init completes successfully)

The app will be available at `http://localhost:3000` (configurable via `ELYOS_PORT`), PostgreSQL on port `5432` (configurable via `POSTGRES_PORT`).

### Database initialization and reset

The `db-init` container (and the `bun db:init` script) is **idempotent** — safe to run multiple times without duplicating data (upsert logic).

If you need a full database reset (wipe all data and re-seed to initial state):

```bash
RESET=1 bun docker:up
```

This runs the same `db-init` container but truncates all tables before seeding.

### Environment Variables

See [`.env.example`](./.env.example) for all available configuration options, including database credentials, auth providers, and dev mode settings.

### Building the image

```bash
docker build -f docker/Dockerfile -t elyos/core:latest .
```

## Plugin Development

ElyOS comes with a complete plugin ecosystem. Create plugins with the CLI, develop with the mock SDK, then load them into a running ElyOS instance.

> **Coming soon...** Detailed documentation and guides for plugin development.

## Documentation

<!--
- [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md) — build plugins from scratch
- [API Reference](./docs/API_REFERENCE.md) — complete SDK API documentation
- [Migration Guide](./docs/MIGRATION.md) — migrate existing plugins to `@elyos/sdk`-->

- [Contributing Guide](./docs/CONTRIBUTING.md) — development setup, code style, PR process
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — common setup issues and how to fix them
- [User Documentation](https://docs.elyos.hu/en/) — user docs
- [Disclaimer](./docs/hu/DISCLAIMER.md) — liability and warranty information

## Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and plugin examples.

Please read the [Contributing Guide](./docs/CONTRIBUTING.md) before submitting a pull request.

## Disclaimer

ElyOS is provided **"as is"**, without warranty of any kind, express or implied — including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

The authors and contributors of this software **accept no liability** for any direct, indirect, incidental, special, consequential, or punitive damages arising from the use, misconfiguration, operation of, or inability to use the software — even if advised of the possibility of such damages.

This includes but is not limited to: data loss or corruption, loss of business revenue or profits, system downtime or service interruption, security incidents or unauthorized access, incompatibility with third-party systems, or any other damages of any kind.

Use of this software is entirely at your own risk. Before deploying in a production environment, it is your responsibility to perform appropriate security audits, configuration reviews, and testing.

See the [full disclaimer](./docs/DISCLAIMER.md) and [LICENSE](./LICENSE) for details.

## License

[MIT](./LICENSE)
