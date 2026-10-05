# Changelog — @racona/cli

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-10-05

### Added

- **`scheduler` feature**: generates `server/jobs.ts` with an example `runDailyCheck` handler (typed with `ScheduledJobHandler` from `@racona/sdk/server`, uses `ctx.logger`, returns `{ summary }`), and adds a `scheduledJobs` entry (`daily-check`, `0 7 * * *`, `Europe/Budapest`) and the `scheduler` permission to `manifest.json`
  - The example is idempotent: it processes everything due up to the run's day that is not done yet. With `database`, the generated `items` table gets a `checked_at` column for this
  - `normalizeFeatures()` adds `remote_functions` when `scheduler` is selected (the handlers live in `server/`)
  - Available in the wizard and via `--features scheduler`
- **Dev server `POST /api/jobs/:jobId/run`**: runs the handler named in `manifest.json` `scheduledJobs` from `server/jobs.ts` with a stub system context (`userId: null`, `trigger: 'manual'`, `permissions: []`, console `logger`, abort signal honouring `timeoutSeconds`). Optional `?today=YYYY-MM-DD` is passed as `params.today`. The response includes the result and the logged lines
- **Dev server remote context**: `notifications` stub next to `email`, like the core

### Changed

- **Generated `package.json`**: `@racona/sdk` dependency raised from `^0.3.2` to `^0.6.0`. On 0.x a caret range stays within the minor version, so new projects were still installing SDK 0.3.x; `^0.6.0` is also the first version with `@racona/sdk/server`, which the generated `server/jobs.ts` imports

### Fixed

- **`bin` path**: `./dist/cli.js` → `dist/cli.js`. npm 12 drops a `bin` entry written with a leading `./` when publishing, so the package would have shipped without the `create-racona-app` command
- **`--version`**: printed a hard-coded `1.0.0`; it now reads the version from the package's `package.json`
- **`database` without `remote_functions`**: `normalizeFeatures()` silently dropped `database` (e.g. `--features database` generated a project without a database). It now adds `remote_functions`, as the README always said
- **Server code packaging**: `build-package.js` now packages `server/` and `email-templates/`. The core loads `server/functions.{js,ts}` and `server/jobs.{js,ts}` from the plugin root, so the generated `build-all.js` no longer compiles `server/functions.ts` into `dist/server` (the core never loaded it); the TypeScript sources are shipped and run by Bun

## [0.4.0] - 2026-04-28

### Added

- **ActionBar support in sidebar template**: generated `App.svelte` now includes ActionBar rendering for standalone dev mode
  - `onMount` hook connects to `MockUIService` callbacks (`_setActionBarFn`, `_clearActionBarFn`)
  - ActionBar buttons render in a top bar above the main content area
  - Full styling support (light + dark mode) with CSS variables
  - Works seamlessly in both standalone mode (dev) and production (Racona)
  - Developers can use `sdk.ui.setActionBar([...])` to add action buttons to their plugins

## [0.3.2] - 2026-04-15

### Changed

- Brand name and documentation updates

## [0.3.1] - 2026-04-14

### Fixed

- README updated to reflect `@racona/cli` package name and `racona.hu` links

## [0.3.0] - 2026-04-14

### Changed

- **Package renamed**: `@racona/create-app` → `@racona/cli`
- **Binary renamed**: `create-racona-app` → `create-racona-app`
- Generated `package.json` SDK dependency updated: `@racona/sdk` → `@racona/sdk: ^0.3.0`

## [0.2.3] - 2026-04-12

### Fixed

- Generated SDK dependency bumped to `^0.2.2`

### Added

- **DataTable standalone support**: generated `Datatable.svelte` imports `SimpleDataTable` directly for standalone mode; in core mode the real `DataTable` runs via `svelte:component`
- **`getItems` server function**: generated `server/functions.ts` exports `getItems` with server-side pagination and sorting (`page`, `pageSize`, `sortBy`, `sortOrder`)
- **`loadData` via `remote.call`**: data loading uses `sdk.remote.call('getItems', ...)` instead of `sdk.data.query()` — works in both standalone and core modes
- **`handleStateChange` triggers reload**: pagination and sorting changes now automatically call `loadData()`
- **`<script module lang="ts">`**: fixed esbuild parse error on first `dev:full` start — all component module blocks now declare TypeScript language

### Fixed

- **`jsonb` value display**: `getItems` uses `value#>>'{}'` instead of `value::text` to strip surrounding quotes from jsonb string values

### Added

- **Wizard — default values**: `description` and `author` fields now have pre-filled defaults (`An Racona application` / `Racona Developer <dev@example.com>`) — pressing Enter accepts the default without typing
- **Wizard — cleaner feature descriptions**: removed parenthetical technical details from feature choice descriptions

## [0.2.0] - 2026-04-11

> 🎉 **Fully rewritten CLI** — the template-based approach has been replaced with feature-based scaffolding. This is a breaking change: instead of fixed templates (`basic`, `advanced`, `datatable`, `sidebar`), an interactive feature selector now drives project generation.

### Changed (breaking)

- **Feature-based generation**: instead of fixed templates, the CLI interactively prompts for desired features (`sidebar`, `database`, `remote_functions`, `notifications`, `i18n`, `datatable`) and generates the project from their combination
- **Single code path**: `generateProject()` is a single function with `hasFeature()` checks — no more template-specific branching
- **`normalizeFeatures()`**: automatically enforces the `database → remote_functions` constraint
- **`computePermissions()`**: automatically computes the `manifest.json` `permissions` array from the feature list

### Added

- **Datatable feature**: when `datatable` + `database` + `remote_functions` are enabled, the generated `Datatable.svelte` includes an insert form, row-level Duplicate/Delete actions (`createActionsColumn`), and full i18n coverage
- **Insert form**: `name` + `value` fields, styled with core CSS variables, with dark mode support
- **Row actions**: Duplicate (primary), Delete (secondary, destructive) — deletion uses `sdk.ui.dialog()` confirmation modal
- **Full i18n in datatable template**: all text via `t()` calls, new translation keys (`datatable.columns.*`, `datatable.form.*`, `datatable.delete.*`, `datatable.success.*`, `datatable.error.*`)
- **Server functions**: generated `server/functions.ts` exports `insertItem`, `deleteItem`, `duplicateItem` with the correct `app__${pluginId}` schema name prefix
- **Button style**: all component templates (`Notifications`, `Remote`, `Datatable`) use `btn-primary` CSS variable-based styling instead of native buttons

### Fixed

- Generated SDK dependency bumped to `^0.2.0`

## [0.1.11] - 2026-04-10

### Changed

- Changelog added to README for visibility on npmjs.com
- `@racona/sdk` bumped to `^0.1.23` in generated `package.json`

## [0.1.10] - 2026-04-10

### Fixed

- **Generated project dependencies**: `@lucide/svelte` bumped from `^0.561.0` to `^1.0.0` in scaffolded `package.json`
- **Generated project dependencies**: `@racona/sdk` bumped from `^0.1.16` to `^0.1.22` in scaffolded `package.json`

## [0.1.9] - 2026-04-09

### Added

- Ko-fi support badge in README

## [0.1.8] - 2026-04-08

### Fixed

- Sidebar template: `Window` interface declaration added to sidebar component templates

## [0.1.7] - 2026-04-08

### Fixed

- **Sidebar template**: standalone dev mode now correctly displays translated text — mock SDK was using a non-reactive `$state` closure; fixed by loading locale files in `main.ts` and passing them to `MockWebOSSDK.initialize()`
- **Sidebar template**: locale switching in standalone mode now updates content components immediately — `setLocale()` is called synchronously before `currentLocale` state changes
- **All templates** (`basic`, `advanced`, `datatable`, `sidebar`): `main.ts` now loads translations dynamically from `locales/*.json` files instead of hardcoding them
- **Sidebar template components** (`Overview`, `Settings`): removed `tr` state boilerplate and `$effect`-based i18n loading; components now use `sdk.i18n.t(key)` directly
- **Generator**: `generateBlankMainTs` now always uses locale file loading when `blankI18n` is enabled, regardless of `blankSidebar`
- **Generator**: `generateBlankOverviewSvelte` now generates components with `sdk.i18n.t()` pattern instead of static text

## [0.1.6] - 2026-03-20

### Fixed

- SDK import path corrected after `@racona/sdk` package name was restored

## [0.1.5] - 2026-03-20

### Fixed

- SDK dependency updated to `@racona/sdk@^0.1.16`

## [0.1.4] - 2026-03-15

### Fixed

- Package name and SDK import alignment after monorepo rename

## [0.1.3] - 2026-03-10

### Added

- Starter template (`--template starter`) with blank scaffold generator
- `generateBlankAppSvelte`, `generateBlankMainTs`, `generateBlankOverviewSvelte` generators

## [0.1.1] - 2026-03-08

### Changed

- Package renamed from `create-racona-plugin` to `@racona/create-app`
- CLI binary renamed to `create-racona-app`
- README updated, language switched to English

## [0.1.0] - 2026-03-07

### Added

- Initial release
- Interactive CLI scaffolding for Racona plugins (`basic`, `advanced`, `datatable`, `sidebar` templates)
- `manifest.json`, `menu.json`, `package.json`, and README generation
