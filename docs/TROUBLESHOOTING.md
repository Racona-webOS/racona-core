# ElyOS Troubleshooting Guide

This guide covers common issues encountered when setting up and running ElyOS.

## Table of Contents

- [Application Won't Start](#application-wont-start)
  - [Missing required environment variables](#missing-required-environment-variables)
  - [Port already in use](#port-already-in-use)
  - [`NODE_ENV` not set](#node_env-not-set)
- [Database Issues](#database-issues)
  - [Cannot connect to PostgreSQL](#cannot-connect-to-postgresql)
  - [Authentication error connecting to database](#authentication-error-connecting-to-database)
  - [Migrations not applied / missing tables](#migrations-not-applied--missing-tables)
  - [`db-init` container exits with error](#db-init-container-exits-with-error)
- [Authentication Problems](#authentication-problems)
  - [`BETTER_AUTH_SECRET` is the default placeholder](#better_auth_secret-is-the-default-placeholder)
  - [`BETTER_AUTH_URL` doesn't match `APP_URL`](#better_auth_url-doesnt-match-app_url)
  - [Google login not working](#google-login-not-working)
  - [Registration is disabled but no admin exists](#registration-is-disabled-but-no-admin-exists)
- [Email Not Working](#email-not-working)
  - [Emails are not being sent](#emails-are-not-being-sent)
  - [SMTP authentication fails](#smtp-authentication-fails)
  - [Wrong SMTP port / TLS mismatch](#wrong-smtp-port--tls-mismatch)
  - [Email verification link expired](#email-verification-link-expired)
  - [Users can't log in because email verification is required but email isn't configured](#users-cant-log-in-because-email-verification-is-required-but-email-isnt-configured)
- [UI Shows Translation Keys Instead of Text](#ui-shows-translation-keys-instead-of-text)
- [403 Errors on Remote Calls](#403-errors-on-remote-calls)
- [Docker Issues](#docker-issues)
  - [`DATABASE_URL` set in `.env` overrides Docker Compose internal URL](#database_url-set-in-env-overrides-docker-compose-internal-url)
  - [Container restarts in a loop](#container-restarts-in-a-loop)
  - [Uploads not persisting after container restart](#uploads-not-persisting-after-container-restart)
  - [Port conflict with PostgreSQL](#port-conflict-with-postgresql)
- [Plugin System Issues](#plugin-system-issues)
  - [Plugin upload fails with size error](#plugin-upload-fails-with-size-error)
  - [Plugin storage directory not writable](#plugin-storage-directory-not-writable)
  - [Dev plugins not loading](#dev-plugins-not-loading)
  - [Scheduled job does not run](#scheduled-job-does-not-run)
- [Logging & Diagnostics](#logging--diagnostics)
  - [No logs appearing](#no-logs-appearing)
  - [Log files not being written](#log-files-not-being-written)
  - [Enabling verbose logging for debugging](#enabling-verbose-logging-for-debugging)

---

## Application Won't Start

### Missing required environment variables

**Symptom:** The app crashes on startup with an error about missing configuration.

**Cause:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, or `BETTER_AUTH_URL` are not set.

**Fix:** Ensure your `.env` file contains at minimum:

```bash
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
```

---

### Port already in use

**Symptom:** `Error: listen EADDRINUSE :::3000`

**Cause:** Another process is already using port 3000 (or whichever port is configured).

**Fix:** Either stop the conflicting process, or change the port:

```bash
ELYOS_PORT=3001
```

---

### `NODE_ENV` not set

**Symptom:** Unexpected behavior, missing features, or insecure defaults.

**Cause:** `NODE_ENV` defaults to `development` if not set. In production this can cause performance and security issues.

**Fix:** Always set `NODE_ENV=production` in production environments.

---

## Database Issues

### Cannot connect to PostgreSQL

**Symptom:** `Connection refused` or `ECONNREFUSED` errors on startup.

**Cause:** The `DATABASE_URL` points to a host/port that isn't reachable.

**Common mistakes:**

- Using `localhost` as the host inside Docker (should be the service name `postgres`)
- Wrong port (default is `5432`)
- PostgreSQL container not yet healthy when the app starts

**Fix (local):**

```bash
DATABASE_URL=postgresql://elyos:elyos123@localhost:5432/elyos
```

**Fix (Docker Compose):** Do not set `DATABASE_URL` in `.env` — Docker Compose constructs it automatically from `POSTGRES_*` variables using the internal `postgres` hostname.

---

### Authentication error connecting to database

**Symptom:** `password authentication failed for user "elyos"`

**Cause:** `POSTGRES_USER` / `POSTGRES_PASSWORD` in `.env` don't match what the database was initialized with.

**Fix:** Make sure `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` in `.env` match the values used when the PostgreSQL volume was first created. If you changed them after the volume was created, reset the volume:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

---

### Migrations not applied / missing tables

**Symptom:** `relation "..." does not exist` errors.

**Cause:** The database was never initialized, or migrations weren't run.

**Fix (Docker):** The `db-init` service runs automatically on first start. If it failed, check its logs:

```bash
docker logs elyos-db-init
```

**Fix (local):**

```bash
bun db:init
```

To re-run migrations only (without resetting data):

```bash
bun db:migrate
```

---

### `db-init` container exits with error

**Symptom:** The `elyos` container never starts because `db-init` didn't complete successfully.

**Cause:** Migration or seed script failed — usually due to a bad `DATABASE_URL` or the postgres container not being ready.

**Fix:** Check the logs and verify the postgres service is healthy before retrying:

```bash
docker logs elyos-db-init
docker compose -f docker/docker-compose.yml up -d
```

---

## Authentication Problems

### `BETTER_AUTH_SECRET` is the default placeholder

**Symptom:** Sessions are insecure or auth tokens are invalid after deployment.

**Cause:** `BETTER_AUTH_SECRET` was left as `your-secret-here` or `change-me-in-production`.

**Fix:** Generate a proper secret and set it before first run:

```bash
openssl rand -base64 32
```

> Changing this secret after users have logged in will invalidate all existing sessions.

---

### `BETTER_AUTH_URL` doesn't match `APP_URL`

**Symptom:** OAuth callbacks fail, email verification links are broken, or users are redirected to the wrong URL.

**Cause:** `BETTER_AUTH_URL` must exactly match the public URL of the application.

**Fix:** Both values must be identical:

```bash
APP_URL=https://elyos.example.com
BETTER_AUTH_URL=https://elyos.example.com
```

---

### Google login not working

**Symptom:** Google sign-in button is missing or returns an error.

**Cause:** `SOCIAL_LOGIN_ENABLED` is `false`, or `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are not set.

**Fix:**

```bash
SOCIAL_LOGIN_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Also ensure the Google OAuth redirect URI is set to `<APP_URL>/api/auth/callback/google` in the Google Cloud Console.

---

### Registration is disabled but no admin exists

**Symptom:** Nobody can log in and there's no way to create an account.

**Cause:** `REGISTRATION_ENABLED=false` was set before the initial admin user was created.

**Fix:** Temporarily re-enable registration, create the admin account, then disable it again. Alternatively, set `ADMIN_USER_EMAIL` before running `bun db:init`:

```bash
ADMIN_USER_EMAIL=admin@example.com
```

The default password is **`Admin123.`** — change it immediately after first login. This is critical: leaving the default password in place is a serious security risk.

---

## Email Not Working

### Emails are not being sent

**Symptom:** Verification emails, OTP codes, or password reset emails never arrive.

**Cause:** Email provider is misconfigured, or `EMAIL_TEST_MODE=true` is set (emails are only logged to console).

**Fix:** Check `EMAIL_TEST_MODE` first:

```bash
EMAIL_TEST_MODE=false
```

Then verify the provider-specific variables match your chosen `EMAIL_PROVIDER`.

---

### SMTP authentication fails

**Symptom:** `535 Authentication failed` or similar SMTP errors in logs.

**Cause:** Wrong `SMTP_USERNAME` / `SMTP_PASSWORD`, or the SMTP server requires an app-specific password (e.g., Gmail).

**Fix:** For Gmail, generate an [App Password](https://support.google.com/accounts/answer/185833) and use it as `SMTP_PASSWORD`. Ensure 2FA is enabled on the Google account first.

---

### Wrong SMTP port / TLS mismatch

**Symptom:** Connection timeouts or TLS handshake errors.

**Cause:** `SMTP_PORT` and `SMTP_SECURE` are mismatched.

**Fix:**

| Port | `SMTP_SECURE` | Protocol |
| ---- | ------------- | -------- |
| 587  | `false`       | STARTTLS |
| 465  | `true`        | SSL/TLS  |
| 25   | `false`       | Plain    |

---

### Email verification link expired

**Symptom:** Users click the verification link and get an "expired" error.

**Cause:** `EMAIL_VERIFICATION_EXPIRES_IN` is too short, or the email was delayed.

**Fix:** Increase the expiration time (in seconds, max 604800 = 7 days):

```bash
EMAIL_VERIFICATION_EXPIRES_IN=172800  # 48 hours
```

---

### Users can't log in because email verification is required but email isn't configured

**Symptom:** New users register but can never verify their email because no emails are sent.

**Cause:** `REQUIRE_EMAIL_VERIFICATION=true` but the email provider isn't set up yet.

**Fix (temporary):** Disable verification while setting up email:

```bash
REQUIRE_EMAIL_VERIFICATION=false
```

Or use `EMAIL_TEST_MODE=true` and manually copy verification links from the server logs during testing.

---

## UI Shows Translation Keys Instead of Text

**Symptom:** The login screen (or other parts of the UI) displays raw translation keys instead of readable text — e.g., `auth.login.title` instead of "Sign in".

This is one of the first visible signs that something is wrong, since it appears before you even log in.

**Cause 1: Missing `ORIGIN` → 403 on translation requests**

The translation loader makes server calls on startup. If `ORIGIN` is misconfigured, these calls return `403 Forbidden` and the UI falls back to showing raw keys.

**Fix:** Set `ORIGIN` to the exact public URL of the app:

```bash
ORIGIN=https://elyos.example.com
```

Check the browser's Network tab — if translation requests return `403`, this is the cause.

**Cause 2: Missing translations in the database**

The translations are stored in the `platform.translations` table. If the database was not seeded, or the seed was incomplete, the table will be empty and no text will load.

**Fix:** Run the seed (or full init) to populate translations:

```bash
# Local
bun db:seed

# Or full reset
bun db:init
```

For Docker, trigger a re-init by resetting the volume:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

You can verify the table directly:

```sql
SELECT COUNT(*) FROM platform.translations;
```

If the result is `0`, the seed didn't run.

---

## 403 Errors on Remote Calls

**Symptom:** Server actions (form submissions, data mutations) return `403 Forbidden`.

**Cause:** The `ORIGIN` variable is not set or doesn't match the actual URL the app is accessed from. SvelteKit's CSRF protection rejects requests where the `Origin` header doesn't match.

**Fix:** Set `ORIGIN` to the exact public URL:

```bash
ORIGIN=https://elyos.example.com
```

This must match the URL in the browser's address bar — including the protocol and port if non-standard.

---

## Docker Issues

### `DATABASE_URL` set in `.env` overrides Docker Compose internal URL

**Symptom:** The app can't reach the database inside Docker even though everything looks correct.

**Cause:** If `DATABASE_URL` is set in `.env` with `localhost` as the host, it overrides the Docker Compose-constructed URL that uses the `postgres` service name.

**Fix:** Comment out or remove `DATABASE_URL` from `.env` when using Docker Compose. The compose file sets it automatically:

```bash
# DATABASE_URL=postgresql://...  ← comment this out for Docker deployments
```

---

### Container restarts in a loop

**Symptom:** `docker logs elyos-app` shows repeated startup errors.

**Cause:** Usually a missing environment variable, failed database connection, or the `db-init` service didn't complete.

**Fix:**

1. Check `db-init` logs: `docker logs elyos-db-init`
2. Check app logs: `docker logs elyos-app`
3. Verify all required variables are set in `.env`

---

### Uploads not persisting after container restart

**Symptom:** Uploaded files disappear when the container is restarted.

**Cause:** The `apps/web/uploads` directory is not mounted as a volume.

**Fix:** The default `docker-compose.yml` already mounts `../apps/web/uploads:/app/uploads`. If you're using a custom setup, ensure this volume mount is present.

---

### Port conflict with PostgreSQL

**Symptom:** `bind: address already in use` for port 5432.

**Cause:** A local PostgreSQL instance is already running on the host.

**Fix:** Change the host-side port mapping:

```bash
POSTGRES_PORT=5433
```

---

## Plugin System Issues

### Plugin upload fails with size error

**Symptom:** Plugin upload is rejected with a size limit error.

**Cause:** The plugin package exceeds `PLUGIN_MAX_SIZE` (default: 10 MB).

**Fix:** Increase the limit (max 100 MB):

```bash
PLUGIN_MAX_SIZE=52428800  # 50 MB
```

---

### Plugin storage directory not writable

**Symptom:** Plugin installation fails with a permission error.

**Cause:** The process doesn't have write access to `PLUGIN_STORAGE_DIR` or `PLUGIN_TEMP_DIR`.

**Fix:** Ensure the directories exist and are writable by the application user:

```bash
mkdir -p /var/webos/plugins /tmp/webos-plugins
chmod 755 /var/webos/plugins
```

---

### Dev plugins not loading

**Symptom:** Plugins loaded from `localhost` URLs don't appear.

**Cause:** `DEV_MODE=false` (the default).

**Fix:** Enable dev mode — only in development:

```bash
DEV_MODE=true
```

> Never set `DEV_MODE=true` in production.

---

### Scheduled job does not run

**Symptom:** A plugin's scheduled job does not run at the expected time, or the Plugin Manager's "Scheduled Jobs" page shows no recent run.

**Checks:**

1. The log should contain `[Scheduler] Started (...)` after start-up. If it says `Disabled`, set `SCHEDULER_ENABLED=true` (at least on one instance).
2. On the "Scheduled Jobs" page the job must be enabled and have a "Next run". A job of an inactive plugin, or of a plugin without the `scheduler` permission, does not run.
3. Times are interpreted in the job's timezone (default `SCHEDULER_DEFAULT_TIMEZONE`, `Europe/Budapest`).
4. A run that timed out keeps the job locked until its timeout + 60 seconds have passed.
5. Check the run history ("History"): failed runs show the error and the job's log lines. After 3 failures in a row the users with the `plugin.scheduler.manage` permission get a notification.

Scheduled jobs have no request, so links in their emails come from `APP_URL` — set it in production.

---

## Logging & Diagnostics

### No logs appearing

**Symptom:** The application runs but produces no log output.

**Cause:** `LOG_LEVEL` is set too high (e.g., `fatal`) or `LOG_TARGETS` doesn't include `console`.

**Fix:**

```bash
LOG_TARGETS=console
LOG_LEVEL=info
```

---

### Log files not being written

**Symptom:** `LOG_TARGETS=file` is set but no files appear in `LOG_DIR`.

**Cause:** The log directory doesn't exist or isn't writable.

**Fix:** Create the directory and ensure it's writable:

```bash
mkdir -p ./logs
```

Or set a custom path:

```bash
LOG_DIR=/var/log/elyos
```

---

### Enabling verbose logging for debugging

To get maximum detail during troubleshooting:

```bash
LOG_TARGETS=console,file
LOG_LEVEL=debug
LOG_DIR=./logs
```

Remember to revert `LOG_LEVEL` to `info` or `warn` in production to avoid performance impact and log noise.
