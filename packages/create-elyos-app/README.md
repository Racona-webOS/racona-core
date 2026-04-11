# @elyos-dev/create-app

CLI tool to scaffold [ElyOS](https://elyos.hu) app projects. Generates a complete project structure with SDK integration, build configuration, and localization — ready to develop in seconds.

<a href="https://www.npmjs.com/package/@elyos-dev/create-app"><img src="https://img.shields.io/npm/v/@elyos-dev/create-app?color=blue" alt="npm version" /></a>
<a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
<a href="https://ko-fi.com/H2H11XIQDF"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white" alt="Support on Ko-fi" /></a>

## Usage

```bash
# Interactive wizard
bunx @elyos-dev/create-app

# With a name
bunx @elyos-dev/create-app my-app

# Skip dependency installation
bunx @elyos-dev/create-app my-app --no-install
```

## Feature-based scaffolding

Instead of fixed templates, the CLI lets you compose your project from individual features. The wizard asks which features to enable — the project is generated based on your selection.

| Feature            | What it adds                                                                    |
| ------------------ | ------------------------------------------------------------------------------- |
| `sidebar`          | Sidebar navigation (`menu.json`, `AppLayout` mode, multiple page components)    |
| `database`         | SQL migrations, `sdk.data.query()` support, local dev database via Docker       |
| `remote_functions` | `server/functions.ts`, `sdk.remote.call()`, local dev server                    |
| `notifications`    | `sdk.notifications.send()` support                                              |
| `i18n`             | `locales/hu.json` + `locales/en.json`, `sdk.i18n.t()` support                   |
| `datatable`        | DataTable component with insert form, row actions (duplicate/delete), full i18n |

> `database` requires `remote_functions` — selecting `database` automatically enables `remote_functions`.

## Interactive Wizard

When run without flags, the CLI walks you through an interactive setup:

1. **App ID** — kebab-case identifier (e.g. `my-app`)
2. **Display Name** — human-readable name shown in ElyOS
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
│   └── functions.ts
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

- A data table loaded via `sdk.data.query()`
- An **insert form** below the table (`name` + `value` fields), styled with core CSS variables
- **Row actions**: Duplicate (primary) and Delete (secondary, destructive) — delete uses `sdk.ui.dialog()` confirm modal
- Full i18n support — all strings use `t()` with translation keys in `locales/`

The generated `server/functions.ts` exports `example`, `insertItem`, `deleteItem`, and `duplicateItem` — all scoped to the plugin's own `app__<id>` database schema.

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

# Test inside ElyOS (requires Docker)
# 1. Start ElyOS: docker compose up -d
# 2. Open Plugin Manager → Dev Plugins tab
# 3. Enter: http://localhost:5174
```

## Generated Files

### `manifest.json`

Plugin metadata used by ElyOS to register and display your app. Includes name, description, permissions (auto-computed from selected features), window size constraints, supported locales, and more.

### `package.json`

Pre-configured with `@elyos-dev/sdk` as a dependency and Vite build scripts. Includes `db:up`, `dev:server`, `dev:full` scripts when `database` is enabled.

### `vite.config.ts`

Configured to build your plugin as an IIFE bundle (`dist/index.iife.js`) compatible with ElyOS's plugin loader.

## Further Reading

- [ElyOS Documentation for developers](https://docs.elyos.hu)

## License

MIT

---

## Changelog

### [0.2.1] - 2026-04-11

- **Added**: wizard `description` and `author` fields now have pre-filled defaults — pressing Enter accepts without typing
- **Added**: feature choice descriptions cleaned up, parenthetical technical details removed

### [0.2.0] - 2026-04-11

> 🎉 **Completely rewritten CLI** — feature-based scaffolding replaces fixed templates. Breaking change: the old fixed templates (`basic`, `advanced`, `datatable`, `sidebar`) are replaced by an interactive feature selector.

- **Changed (breaking)**: feature-based generation with a single `generateProject()` code path and `hasFeature()` checks — `normalizeFeatures()` and `computePermissions()` pure helpers
- **Added**: datatable feature — insert form, Duplicate/Delete row actions (`createActionsColumn`), full i18n
- **Added**: generated `server/functions.ts` exports `insertItem`, `deleteItem`, `duplicateItem` with correct `app__` schema prefix
- **Added**: all component templates use `btn-primary` CSS variable-based styling
- **Fix**: generated SDK dependency bumped to `^0.2.0`

### [0.1.11] - 2026-04-10

- **Docs**: changelog added to README (visible on npmjs.com)
- **Fix**: `@elyos-dev/sdk` bumped to `^0.1.23` in generated `package.json`

### [0.1.10] - 2026-04-10

- **Fix**: `@lucide/svelte` bumped from `^0.561.0` to `^1.0.0` in generated `package.json`
- **Fix**: `@elyos-dev/sdk` bumped from `^0.1.16` to `^0.1.22` in generated `package.json`

### [0.1.7] - 2026-04-08

- **Fix**: Sidebar template standalone dev mode i18n — locale files loaded in `main.ts`, passed to `MockWebOSSDK.initialize()`
- **Fix**: Locale switching in standalone mode now updates components immediately
- **Fix**: All templates load translations dynamically from `locales/*.json` instead of hardcoding them

### [0.1.0] - 2026-03-07

- Initial release — interactive CLI scaffolding for ElyOS plugins
