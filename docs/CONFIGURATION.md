# ElyOS Configuration Guide

This guide covers all environment variables and configuration options for self-hosting ElyOS.

## Table of Contents

- [Environment Variable Management](#environment-variable-management)
- [Quick Start](#quick-start)
- [Environment Variables Reference](#environment-variables-reference)
  - [Server Configuration](#server-configuration)
  - [Database](#database)
  - [Application Branding](#application-branding)
  - [Authentication](#authentication)
  - [Email](#email)
  - [Email Verification](#email-verification)
  - [Internationalization](#internationalization)
  - [Logging](#logging)
  - [Initial Admin User](#initial-admin-user)
  - [Development Mode](#development-mode)
  - [Demo Mode](#demo-mode)
  - [Public Site](#public-site)
  - [Plugin System](#plugin-system)
- [Self-Hosting Guide](#self-hosting-guide)
  - [Minimal Setup (Docker)](#minimal-setup-docker)
  - [Full Production Setup](#full-production-setup)
- [Docker Configuration](#docker-configuration)
- [Email Provider Setup](#email-provider-setup)
- [Security Configuration](#security-configuration)

---

## Environment Variable Management

ElyOS uses **Varlock** for typesafe environment variable management. Varlock validates all configuration at startup, ensuring misconfiguration is caught immediately.

For detailed Varlock documentation, see the [developer documentation](https://docs.elyos.dev/en/varlock).

### Bootstrap credentials

Only bootstrap credentials remain in the `.env` file:

```dotenv
INFISICAL_CLIENT_ID=your-machine-identity-client-id
INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
```

All other secrets are fetched from Infisical at runtime.

### Local fallback mode

For offline development or without Infisical:

```dotenv
VARLOCK_FALLBACK=local
NODE_ENV=development
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=your-local-secret
# ... all other variables
```

---

## Quick Start

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Set the required variables:

   **With Varlock + Infisical (recommended):**

   ```bash
   # Only bootstrap credentials are required in .env
   INFISICAL_CLIENT_ID=your-machine-identity-client-id
   INFISICAL_CLIENT_SECRET=your-machine-identity-client-secret
   ```

   **Without Infisical (local fallback mode):**

   ```bash
   # Set VARLOCK_FALLBACK=local and provide all variables
   VARLOCK_FALLBACK=local
   DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
   NODE_ENV=development
   BETTER_AUTH_SECRET=generate-a-random-secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. Start with Docker:

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

   Or run locally:

   ```bash
   bun install
   bun db:init
   bun app:dev
   ```

---

## Environment Variables Reference

### Server Configuration

| Variable          | Required   | Default    | Description                                                         |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------- |
| `NODE_ENV`        | Yes        | —          | Application environment: `development`, `production`, or `test`     |
| `BODY_SIZE_LIMIT` | No         | `10485760` | Maximum request body size in bytes (10 MB)                          |
| `ELYOS_PORT`      | No         | `3000`     | Port for the ElyOS application (Docker host port mapping)           |
| `APP_URL`         | Production | —          | Base URL of your ElyOS instance (e.g., `https://elyos.example.com`) |

### Database

| Variable            | Required | Default     | Description                                                         |
| ------------------- | -------- | ----------- | ------------------------------------------------------------------- |
| `DATABASE_URL`      | Yes      | —           | PostgreSQL connection string: `postgresql://USER:PASS@HOST:PORT/DB` |
| `POSTGRES_USER`     | Yes      | —           | PostgreSQL username                                                 |
| `POSTGRES_PASSWORD` | Yes      | —           | PostgreSQL password                                                 |
| `POSTGRES_HOST`     | Yes      | `localhost` | PostgreSQL server address                                           |
| `POSTGRES_DB`       | Yes      | —           | PostgreSQL database name                                            |
| `POSTGRES_PORT`     | Yes      | `5432`      | PostgreSQL port                                                     |

> **Note:** The `DATABASE_URL` is automatically constructed from the `POSTGRES_*` variables in the schema. When using Docker Compose, `POSTGRES_HOST` should be set to `postgres` (the service name).

### Application Branding

| Variable         | Required | Default | Description                                                         |
| ---------------- | -------- | ------- | ------------------------------------------------------------------- |
| `APP_NAME`       | No       | `ElyOS` | Application display name shown in the UI and emails                 |
| `APP_LOGO_URL`   | No       | —       | Logo URL — absolute (`https://...`) or relative (`/logo-small.png`) |
| `EMAIL_USE_LOGO` | No       | `false` | Use logo image in emails instead of text                            |

### Authentication

| Variable               | Required   | Default | Description                                                                                                                                                                                         |
| ---------------------- | ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Production | —       | Secret key for signing auth tokens. Generate with `openssl rand -base64 32`                                                                                                                         |
| `BETTER_AUTH_URL`      | Yes        | —       | Base URL for auth callbacks. Must match `APP_URL`                                                                                                                                                   |
| `ORIGIN`               | Production | —       | Public URL of the application — required for SvelteKit's CSRF protection. Must match `APP_URL` (e.g., `https://elyos.example.com`). Without this, remote function calls will fail with a 403 error. |
| `REGISTRATION_ENABLED` | No         | `true`  | Allow new user registration                                                                                                                                                                         |
| `SOCIAL_LOGIN_ENABLED` | No         | `true`  | Enable social login providers (Google)                                                                                                                                                              |
| `GOOGLE_CLIENT_ID`     | No         | —       | Google OAuth 2.0 client ID                                                                                                                                                                          |
| `GOOGLE_CLIENT_SECRET` | No         | —       | Google OAuth 2.0 client secret                                                                                                                                                                      |

### Email

| Variable               | Required | Default  | Description                                            |
| ---------------------- | -------- | -------- | ------------------------------------------------------ |
| `EMAIL_PROVIDER`       | No       | `resend` | Email provider: `smtp`, `resend`, `sendgrid`, or `ses` |
| `EMAIL_TEST_MODE`      | No       | `false`  | Log emails to console instead of sending               |
| `EMAIL_LOG_LEVEL`      | No       | `debug`  | Email logging level: `debug`, `info`, `warn`, `error`  |
| `EMAIL_OTP_EXPIRES_IN` | No       | `10`     | OTP expiration in minutes (1–20)                       |

**SMTP variables** (required when `EMAIL_PROVIDER=smtp`):

| Variable          | Required | Default | Description                                 |
| ----------------- | -------- | ------- | ------------------------------------------- |
| `SMTP_HOST`       | Yes      | —       | SMTP server hostname                        |
| `SMTP_PORT`       | Yes      | —       | SMTP server port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE`     | No       | `false` | Use SSL/TLS connection                      |
| `SMTP_USERNAME`   | Yes      | —       | SMTP authentication username                |
| `SMTP_PASSWORD`   | Yes      | —       | SMTP authentication password                |
| `SMTP_FROM_EMAIL` | No       | —       | Sender email address                        |
| `SMTP_FROM_NAME`  | No       | —       | Sender display name                         |
| `SMTP_REPLY_TO`   | No       | —       | Reply-to email address                      |

**Resend variables** (required when `EMAIL_PROVIDER=resend`):

| Variable                | Required | Default | Description                        |
| ----------------------- | -------- | ------- | ---------------------------------- |
| `RESEND_API_KEY`        | Yes      | —       | Resend API key (starts with `re_`) |
| `RESEND_FROM_EMAIL`     | Yes      | —       | Verified sender email              |
| `RESEND_VERIFIED_EMAIL` | No       | —       | Verified email for testing         |
| `RESEND_WEBHOOK_SECRET` | No       | —       | Webhook signing secret             |

**SendGrid variables** (required when `EMAIL_PROVIDER=sendgrid`):

| Variable              | Required | Default | Description                          |
| --------------------- | -------- | ------- | ------------------------------------ |
| `SENDGRID_API_KEY`    | Yes      | —       | SendGrid API key (starts with `SG.`) |
| `SENDGRID_FROM_EMAIL` | Yes      | —       | Verified sender email                |

**AWS SES variables** (required when `EMAIL_PROVIDER=ses`):

| Variable                | Required | Default | Description                       |
| ----------------------- | -------- | ------- | --------------------------------- |
| `AWS_REGION`            | Yes      | —       | AWS region (e.g., `eu-central-1`) |
| `AWS_ACCESS_KEY_ID`     | Yes      | —       | AWS access key ID                 |
| `AWS_SECRET_ACCESS_KEY` | Yes      | —       | AWS secret access key             |

### Email Verification

| Variable                          | Required | Default | Description                                                    |
| --------------------------------- | -------- | ------- | -------------------------------------------------------------- |
| `REQUIRE_EMAIL_VERIFICATION`      | No       | `true`  | Require email verification for new accounts                    |
| `EMAIL_VERIFICATION_EXPIRES_IN`   | No       | `86400` | Verification link expiration in seconds (max: 604800 = 7 days) |
| `AUTO_SIGNIN_AFTER_VERIFICATION`  | No       | `false` | Auto sign-in after successful verification                     |
| `VERIFICATION_FEATURE_ENABLED`    | No       | `true`  | Master toggle for email verification                           |
| `VERIFICATION_NEW_USERS_ONLY`     | No       | `false` | Only require verification for new users                        |
| `VERIFICATION_ROLLOUT_PERCENTAGE` | No       | `100`   | Percentage of users subject to verification (0–100)            |
| `VERIFICATION_ROLLOUT_START_DATE` | No       | —       | ISO 8601 date for rollout start                                |

### Internationalization

| Variable            | Required | Default | Description                                     |
| ------------------- | -------- | ------- | ----------------------------------------------- |
| `SUPPORTED_LOCALES` | No       | `hu,en` | Comma-separated list of supported locale codes  |
| `DEFAULT_LOCALE`    | No       | `hu`    | Default locale (must be in `SUPPORTED_LOCALES`) |

### Logging

| Variable      | Required | Default   | Description                                                  |
| ------------- | -------- | --------- | ------------------------------------------------------------ |
| `LOG_TARGETS` | No       | `console` | Comma-separated log targets: `console`, `file`, `database`   |
| `LOG_LEVEL`   | No       | `error`   | Minimum log level: `debug`, `info`, `warn`, `error`, `fatal` |
| `LOG_DIR`     | No       | `./logs`  | Directory for log files (when `file` target is active)       |

### Initial Admin User

| Variable           | Required | Default | Description                                                             |
| ------------------ | -------- | ------- | ----------------------------------------------------------------------- |
| `ADMIN_USER_EMAIL` | Yes      | —       | Email address for the first admin user (used during db:init / db:reset) |

### Development Mode

| Variable   | Required | Default | Description                                   |
| ---------- | -------- | ------- | --------------------------------------------- |
| `DEV_MODE` | No       | `false` | Enable dev plugin loading from localhost URLs |

> **Security warning:** Never enable `DEV_MODE` in production. It allows loading arbitrary code from localhost, which is intended only for plugin development.

### Demo Mode

| Variable                  | Required | Default | Description                                                     |
| ------------------------- | -------- | ------- | --------------------------------------------------------------- |
| `DEMO_MODE`               | No       | `false` | Enable demo mode (read-only, no real data changes)              |
| `DEMO_RESET_HOUR`         | No       | `4`     | Hour (UTC, 0–23) when the demo database resets daily            |
| `DEMO_RESET_UPLOADS_KEEP` | No       | —       | Comma-separated uploads subdirectories to preserve during reset |

### Public Site

| Variable              | Required | Default | Description                                                                       |
| --------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `PUBLIC_SITE_ENABLED` | No       | `true`  | Enable the public-facing site. Set to `false` to redirect all traffic to `/admin` |

### Plugin System

| Variable                   | Required | Default              | Description                                           |
| -------------------------- | -------- | -------------------- | ----------------------------------------------------- |
| `PLUGIN_PACKAGE_EXTENSION` | No       | `elyospkg`           | Plugin package file extension (without dot)           |
| `PLUGIN_MAX_SIZE`          | No       | `10485760`           | Maximum plugin package size in bytes (max: 100 MB)    |
| `PLUGIN_STORAGE_DIR`       | No       | `/var/webos/plugins` | Directory for installed plugin files                  |
| `PLUGIN_TEMP_DIR`          | No       | `/tmp/webos-plugins` | Temporary directory for plugin uploads and extraction |

---

## Self-Hosting Guide

### Minimal Setup (Docker)

The fastest way to run ElyOS is with Docker Compose. This starts both ElyOS and PostgreSQL with sensible defaults.

1. Clone the repository:

   ```bash
   git clone https://github.com/elyos/elyos-core.git
   cd elyos-core
   ```

2. Create a minimal `.env` file:

   ```bash
   # .env
   BETTER_AUTH_SECRET=your-random-secret-here
   POSTGRES_PASSWORD=your-db-password
   ADMIN_USER_EMAIL=admin@example.com
   ```

3. Start the services:

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. Open `http://localhost:3000` in your browser.

That's it. Docker Compose handles the database setup, migrations, and networking automatically.

### Full Production Setup

For production deployments, configure all security-relevant variables:

```bash
# .env (production)

# Server
NODE_ENV=production
ELYOS_PORT=3000
APP_URL=https://elyos.yourdomain.com

# Database
POSTGRES_USER=elyos
POSTGRES_PASSWORD=a-strong-random-password
POSTGRES_HOST=postgres
POSTGRES_DB=elyos
POSTGRES_PORT=5432

# Authentication
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=https://elyos.yourdomain.com
REGISTRATION_ENABLED=true

# Email (pick one provider)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password

# Branding
APP_NAME=My ElyOS Instance

# Admin
ADMIN_USER_EMAIL=admin@yourdomain.com

# Logging
LOG_TARGETS=console,database
LOG_LEVEL=info

# Security
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
```

Then start with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Place a reverse proxy (nginx, Caddy, Traefik) in front of ElyOS to handle TLS termination.

---

## Docker Configuration

### Deployment modes

ElyOS supports three Docker deployment modes:

| Mode       | Compose file                       | Script                 | Description                                                        |
| ---------- | ---------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| Full stack | `docker/docker-compose.yml`        | `bun docker:up`        | postgres + db-init + app. Recommended for most users.              |
| Bundle     | `docker/docker-compose.bundle.yml` | `bun docker:up:bundle` | postgres + app, initialized from `init.sql`. No db-init container. |
| App only   | `docker/docker-compose.app.yml`    | `bun docker:up:app`    | App only, connects to an external database.                        |

**Bundle mode** requires generating the init SQL first:

```bash
bun db:generate-sql   # generates packages/database/init.sql
bun docker:up:bundle
```

### Docker Compose Services

The `docker/docker-compose.yml` defines two services:

| Service    | Image                          | Default Port | Description           |
| ---------- | ------------------------------ | ------------ | --------------------- |
| `elyos`    | Built from `docker/Dockerfile` | `3000`       | ElyOS web application |
| `postgres` | `postgres:16-alpine`           | `5432`       | PostgreSQL database   |

### Docker-Specific Variables

These variables are used by Docker Compose and have defaults in the compose file:

| Variable               | Default                   | Description                                  |
| ---------------------- | ------------------------- | -------------------------------------------- |
| `ELYOS_PORT`           | `3000`                    | Host port mapped to the ElyOS container      |
| `POSTGRES_PORT`        | `5432`                    | Host port mapped to the PostgreSQL container |
| `POSTGRES_USER`        | `elyos`                   | PostgreSQL superuser name                    |
| `POSTGRES_PASSWORD`    | `elyos123`                | PostgreSQL superuser password                |
| `POSTGRES_HOST`        | `postgres`                | PostgreSQL server address (service name)     |
| `POSTGRES_DB`          | `elyos`                   | PostgreSQL database name                     |
| `NODE_ENV`             | `production`              | Application environment inside the container |
| `DEV_MODE`             | `false`                   | Enable dev plugin loading                    |
| `APP_NAME`             | `ElyOS`                   | Application display name                     |
| `BETTER_AUTH_URL`      | `http://localhost:3000`   | Auth callback base URL                       |
| `BETTER_AUTH_SECRET`   | `change-me-in-production` | Auth signing secret                          |
| `PUBLIC_SITE_ENABLED`  | `false`                   | Public site toggle                           |
| `REGISTRATION_ENABLED` | `true`                    | User registration toggle                     |
| `DEFAULT_LOCALE`       | `hu`                      | Default language                             |
| `SUPPORTED_LOCALES`    | `hu,en`                   | Available languages                          |
| `LOG_TARGETS`          | `console`                 | Log output targets                           |
| `LOG_LEVEL`            | `info`                    | Minimum log level                            |

> **Important:** The `DATABASE_URL` is constructed automatically inside Docker Compose from the `POSTGRES_*` variables. Do not set `DATABASE_URL` in your `.env` when using Docker — it will be overridden.

### Data Persistence

PostgreSQL data is stored in a named Docker volume (`elyos-data`). This persists across container restarts and `docker compose down`. To completely reset the database:

```bash
docker compose -f docker/docker-compose.yml down -v
```

### Custom Docker Compose Overrides

Create a `docker-compose.override.yml` to customize without modifying the original:

```yaml
# docker-compose.override.yml
services:
  elyos:
    environment:
      - DEV_MODE=true
    ports:
      - '8080:3000'
```

---

## Email Provider Setup

ElyOS supports four email providers. Set `EMAIL_PROVIDER` and configure the corresponding variables.

### SMTP

Works with any SMTP server (Gmail, Outlook, Mailgun, custom).

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

> For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your account password.

### Resend

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### AWS SES

```bash
EMAIL_PROVIDER=ses
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Testing Without Email

Set `EMAIL_TEST_MODE=true` to log all emails to the console instead of sending them. Useful for local development.

---

## Security Configuration

### Authentication Secrets

Generate a strong `BETTER_AUTH_SECRET` for production:

```bash
openssl rand -base64 32
```

Never reuse secrets across environments. Rotating the secret will invalidate all existing sessions.

### Two-Factor Authentication (2FA)

ElyOS supports TOTP-based 2FA with backup codes. This is configured per-user through the Settings app — no environment variables needed.

### Registration Control

- `REGISTRATION_ENABLED=false` — disables new user sign-ups (admin can still create users)
- `PUBLIC_SITE_ENABLED=false` — redirects all unauthenticated traffic to the login page

### Development Mode Security

`DEV_MODE=true` allows loading plugins from `localhost` URLs. This is a security risk in production because it enables arbitrary code execution. Always set `DEV_MODE=false` in production.

### Recommended Production Settings

```bash
NODE_ENV=production
DEV_MODE=false
PUBLIC_SITE_ENABLED=false
REQUIRE_EMAIL_VERIFICATION=true
BETTER_AUTH_SECRET=<strong-random-value>
POSTGRES_PASSWORD=<strong-random-value>
ADMIN_USER_EMAIL=admin@example.com
```
