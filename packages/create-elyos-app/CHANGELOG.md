# Changelog — @elyos-dev/create-app

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-04-11

### Added

- **Wizard — default values**: `description` and `author` fields now have pre-filled defaults (`An ElyOS application` / `ElyOS Developer <dev@example.com>`) — pressing Enter accepts the default without typing
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
- `@elyos-dev/sdk` bumped to `^0.1.23` in generated `package.json`

## [0.1.10] - 2026-04-10

### Fixed

- **Generated project dependencies**: `@lucide/svelte` bumped from `^0.561.0` to `^1.0.0` in scaffolded `package.json`
- **Generated project dependencies**: `@elyos-dev/sdk` bumped from `^0.1.16` to `^0.1.22` in scaffolded `package.json`

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

- SDK import path corrected after `@elyos-dev/sdk` package name was restored

## [0.1.5] - 2026-03-20

### Fixed

- SDK dependency updated to `@elyos-dev/sdk@^0.1.16`

## [0.1.4] - 2026-03-15

### Fixed

- Package name and SDK import alignment after monorepo rename

## [0.1.3] - 2026-03-10

### Added

- Starter template (`--template starter`) with blank scaffold generator
- `generateBlankAppSvelte`, `generateBlankMainTs`, `generateBlankOverviewSvelte` generators

## [0.1.1] - 2026-03-08

### Changed

- Package renamed from `create-elyos-plugin` to `@elyos-dev/create-app`
- CLI binary renamed to `create-elyos-app`
- README updated, language switched to English

## [0.1.0] - 2026-03-07

### Added

- Initial release
- Interactive CLI scaffolding for ElyOS plugins (`basic`, `advanced`, `datatable`, `sidebar` templates)
- `manifest.json`, `menu.json`, `package.json`, and README generation
