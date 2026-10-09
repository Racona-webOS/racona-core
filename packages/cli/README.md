# @racona/cli

CLI tool to scaffold [Racona](https://racona.hu) app projects. Generates a complete project structure with SDK integration, build configuration, and localization — ready to develop in seconds.

<a href="https://www.npmjs.com/package/@racona/cli"><img src="https://img.shields.io/npm/v/@racona/cli?color=blue" alt="npm version" /></a>
<a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
<a href="https://ko-fi.com/racona"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white" alt="Support on Ko-fi" /></a>

## Usage

```bash
# Interactive wizard
bunx @racona/cli

# With a name
bunx @racona/cli my-app

# Skip dependency installation
bunx @racona/cli my-app --no-install
```

## Feature-based scaffolding

Instead of fixed templates, the CLI lets you compose your project from individual features. The wizard asks which features to enable — the project is generated based on your selection.

| Feature            | What it adds                                                                    |
| ------------------ | ------------------------------------------------------------------------------- |
| `sidebar`          | Sidebar navigation (`menu.json`, `AppLayout` mode, multiple page components)    |
| `database`         | SQL migrations, `sdk.data.query()` support, local dev database via Docker       |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, local dev server                    |
| `notifications`    | `sdk.notifications.send()` support                                              |
| `scheduler`        | `server/jobs.ts` with an example scheduled job, `scheduledJobs` in the manifest |
| `i18n`             | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` support                   |
| `datatable`        | DataTable component with insert form, row actions (duplicate/delete), full i18n |

> `database` and `scheduler` need the `server/` folder — selecting either one automatically enables `remote_functions`.

## Interactive Wizard

When run without flags, the CLI walks you through an interactive setup:

1. **App ID** — kebab-case identifier (e.g. `my-app`)
2. **Display Name** — human-readable name shown in Racona
3. **Description** — short description
4. **Author** — your name and email
5. **Features** — pick what you need (see table above)
6. **Install dependencies?** — runs `bun install` automatically

## Generated Structure

The structure depends on selected features. Example with all features enabled:

```
my-app/
├── manifest.json          # App metadata and permissions
├── package.json
├── vite.config.ts
├── tsconfig.json
├── menu.json              # (if sidebar)
├── build-all.js           # (if sidebar)
├── dev-server.ts          # (if remote_functions)
├── docker-compose.dev.yml # (if database)
├── .env.example           # (if database)
├── src/
│   ├── App.svelte
│   ├── main.ts
│   ├── plugin.ts
│   └── components/        # (if sidebar)
│       ├── Overview.svelte
│       ├── Settings.svelte
│       ├── Datatable.svelte     # (if datatable)
│       ├── Notifications.svelte # (if notifications)
│       └── Remote.svelte        # (if remote_functions)
├── server/                # (if remote_functions)
│   ├── functions.ts
│   └── jobs.ts            # (if scheduler)
├── migrations/            # (if database)
│   ├── 001_init.sql
│   └── dev/
│       └── 000_auth_seed.sql
├── locales/               # (if i18n)
│   ├── hu.json
│   └── en.json
└── assets/
    └── icon.svg
```

## Datatable Feature

When `datatable` + `database` + `remote_functions` are all enabled, the generated `Datatable.svelte` includes:

- A data table loaded via `sdk.remote.call('getItems', ...)`
- An **insert form** below the table (`name` + `value` fields), styled with core CSS variables
- **Row actions**: Duplicate (primary) and Delete (secondary, destructive) — delete uses `sdk.ui.dialog()` confirm modal
- Full i18n support — all strings use `t()` with translation keys in `locales/`

The generated `server/functions.ts` exports `getItems`, `insertItem`, `deleteItem`, and `duplicateItem` — all scoped to the plugin's own `app__<id>` database schema.

## Scheduler Feature

When `scheduler` is enabled, the project gets the `scheduler` permission, an example job in `manifest.json`, and its handler in `server/jobs.ts`:

```jsonc
"scheduledJobs": [{
	"id": "daily-check",
	"handler": "runDailyCheck",
	"schedule": "0 7 * * *",
	"timezone": "Europe/Budapest",
	"description": { "hu": "…", "en": "…" },
	"timeoutSeconds": 600,
	"catchUp": "once"
}]
```

- The handler is typed with `ScheduledJobHandler` from `@racona/sdk/server`. It runs without a calling user (`ctx.userId` is `null`, `ctx.permissions` is empty) and logs through `ctx.logger`.
- Job handlers live in `server/jobs.ts`, not in `server/functions.ts`: the remote endpoint only loads `functions`, so users cannot call a job through `sdk.remote.call()`.
- The example is idempotent: it processes everything that is due up to the run's day and not done yet, so a missed run that is caught up later, or a repeated manual run, does no work twice. With `database` it uses a `checked_at` column in the generated `items` table.
- The dev server gets a `POST /api/jobs/:jobId/run` endpoint that calls the handler with a stub system context. The optional `?today=YYYY-MM-DD` query parameter reaches the handler as `params.today`:

```bash
curl -X POST 'http://localhost:5175/api/jobs/daily-check/run?today=2026-01-31'
```

## Database Feature

When `database` is enabled:

```bash
cp .env.example .env
bun db:up          # Start local Postgres (Docker)
bun dev:server     # Start dev server (runs migrations automatically)
bun dev            # Start Vite dev server (separate terminal)

# Or in one step:
bun dev:full
```

## Development Workflow

```bash
cd my-app

# Start standalone dev server (uses mock SDK)
bun dev

# Build for production
bun run build

# Create the installable package (<id>-<version>.raconapkg)
bun run package

# Test inside Racona (requires Docker)
# 1. Start Racona: docker compose up -d
# 2. Open Plugin Manager → Dev Plugins tab
# 3. Enter: http://localhost:5175
```

## Generated Files

### `manifest.json`

Plugin metadata used by Racona to register and display your app. Includes name, description, permissions (auto-computed from selected features), window size constraints, supported locales, and more.

### `package.json`

Pre-configured with `@racona/sdk` as a dependency and Vite build scripts. Includes `db:up`, `dev:server`, `dev:full` scripts when `database` is enabled.

### `vite.config.ts`

Configured to build your plugin as an IIFE bundle (`dist/index.iife.js`) compatible with Racona's plugin loader.

### `server/`

Server code is not compiled. `bun run package` puts the TypeScript sources (`server/`, plus `migrations/` and `email-templates/` when present) into the package, and Racona loads `server/functions.ts` and `server/jobs.ts` from the plugin root and runs them with Bun.

### `knowledge-base/`

Optional documentation for the Racona AI assistant (`knowledge-base/hu/*.md`, `knowledge-base/en/*.md`). Create the folder by hand; `bun run package` includes it when present, and after installation the assistant also answers from it for users who can access the plugin.

### `help/`

Optional user guide shown in the Racona Help app. Create the folder by hand; `bun run package` includes it when present.

```
help/
  hu/index.md          main page: the window's ? button opens this
  hu/projects.md       further pages (subfolders are allowed)
  en/index.md          other languages are optional, Help falls back to Hungarian
  assets/screen.webp   images, referenced relative to the page: ![Screen](../assets/screen.webp)
```

Pages use Starlight-style frontmatter (`title`, `description`, `sidebar.order`). Link between pages with relative paths (`./projects.md`); link to the built-in Racona help with `/hu/user/...` paths. Only Markdown and image files (`png`, `jpg`, `gif`, `webp`, `svg`) are allowed, at most 10 MB in total. Help is visible to users who can access the plugin.

## Further Reading

- [Racona Developer Documentation](https://docs.racona.hu)

## License

MIT

---

## Changelog

### [0.5.4] - 2026-10-09

- **Added**: `build-package.js` packages the `help/` folder (plugin user guide for the Racona Help app)
- **Changed**: the repository moved to `github.com/szigetidev/racona-core`

### [0.5.3] - 2026-10-07

- **Added**: `build-package.js` packages the `knowledge-base/` folder (documentation for the AI assistant, core 0.7.0+)

### [0.5.2] - 2026-10-06

- **Changed**: generated `package.json` depends on `@racona/sdk` `^0.8.0` (`sdk.context.shell` for the mobile interface, `replyTo` for plugin emails)

### [0.5.1] - 2026-10-06

- **Changed**: generated `package.json` depends on `@racona/sdk` `^0.7.0` (plugin file storage: `sdk.files`, `context.files`)

### [0.5.0] - 2026-10-05

- **Changed**: generated `package.json` depends on `@racona/sdk` `^0.6.0` (was `^0.3.2`, which kept new projects on SDK 0.3.x); 0.6.0 is the first SDK with `@racona/sdk/server`
- **Added**: `scheduler` feature — `server/jobs.ts` with an example `ScheduledJobHandler`, a `scheduledJobs` entry and the `scheduler` permission in `manifest.json`; implies `remote_functions`
- **Added**: dev server `POST /api/jobs/:jobId/run` endpoint (optional `?today=YYYY-MM-DD` → `params.today`) with a stub system context
- **Fixed**: `build-package.js` packages `server/` and `email-templates/`; the generated `build-all.js` no longer compiles `server/functions.ts` into `dist/server`, which Racona never loaded
- **Added**: dev server remote context includes a `notifications` stub, like the core
- **Fixed**: `--version` printed a hard-coded `1.0.0`; it now reports the package version
- **Fixed**: selecting `database` without `remote_functions` silently dropped `database`; it now enables `remote_functions`, as documented

### [0.4.0] - 2026-04-28

- **Added**: ActionBar support in sidebar template — generated `App.svelte` now includes ActionBar rendering for standalone dev mode
  - `onMount` hook connects to `MockUIService` callbacks (`_setActionBarFn`, `_clearActionBarFn`)
  - ActionBar buttons render in a top bar above the main content area
  - Full styling support (light + dark mode) with CSS variables
  - Works seamlessly in both standalone mode (dev) and production (Racona)
  - Developers can use `sdk.ui.setActionBar([...])` to add action buttons to their plugins

### [0.3.2] - 2026-04-15

- **Changed**: Brand name and documentation updates

### [0.3.0] - 2026-04-14

- **Changed**: Package renamed from `@racona/create-app` to `@racona/cli`
- **Changed**: Binary renamed from `create-racona-app` to `create-racona-app`
- **Changed**: Generated `package.json` SDK dependency updated to `@racona/sdk: ^0.3.0`

### [0.2.2] - 2026-04-12

- **Added**: `SimpleDataTable` standalone support — generated `Datatable.svelte` uses `SimpleDataTable` directly in standalone mode; real `DataTable` in core mode
- **Added**: `getItems` server function with server-side pagination and sorting
- **Added**: `loadData` uses `sdk.remote.call('getItems', ...)` — works in both standalone and core modes
- **Added**: `handleStateChange` now triggers `loadData()` — pagination and sorting reload data automatically
- **Fix**: `<script module lang="ts">` — fixed esbuild parse error on first `dev:full` start
- **Fix**: `jsonb` value display — `value#>>'{}'` strips surrounding quotes from jsonb string values

### [0.2.0] - 2026-04-11

> 🎉 **Completely rewritten CLI** — feature-based scaffolding replaces fixed templates. Breaking change: the old fixed templates (`basic`, `advanced`, `datatable`, `sidebar`) are replaced by an interactive feature selector.

- **Changed (breaking)**: feature-based generation with a single `generateProject()` code path and `hasFeature()` checks — `normalizeFeatures()` and `computePermissions()` pure helpers
- **Added**: datatable feature — insert form, Duplicate/Delete row actions (`createActionsColumn`), full i18n
- **Added**: generated `server/functions.ts` exports `insertItem`, `deleteItem`, `duplicateItem` with correct `app__` schema prefix
- **Added**: all component templates use `btn-primary` CSS variable-based styling

### [0.1.7] - 2026-04-08

- **Fix**: Sidebar template standalone dev mode i18n — locale files loaded in `main.ts`, passed to `MockWebOSSDK.initialize()`
- **Fix**: Locale switching in standalone mode now updates components immediately
- **Fix**: All templates load translations dynamically from `locales/*.json` instead of hardcoding them

### [0.1.0] - 2026-03-07

- Initial release — interactive CLI scaffolding for Racona plugins
