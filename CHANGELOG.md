# Changelog

[🇭🇺 Magyar verzió](./CHANGELOG_HU.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-11

### Fixed

- **Plugin data endpoints** (`/api/plugins/[pluginId]/data/*`): all four endpoints (`query`, `get`, `set`, `delete`) were using `plugin_` schema prefix instead of the correct `app__` prefix — fixed to match the installer's `sanitizeSchemaName` output
- **Plugin data query endpoint**: cross-schema access check updated from `plugin_` to `app__` prefix pattern

### Added (`@elyos-dev/sdk@0.2.0`)

- Version bump to align all packages at `0.2.0`

### Added (`@elyos-dev/create-app@0.2.0`)

- **Teljesen újraírt CLI — feature-alapú scaffolding** _(breaking change)_: the old fixed templates (`basic`, `advanced`, `datatable`, `sidebar`) are replaced by an interactive feature selector (`sidebar`, `database`, `remote_functions`, `notifications`, `i18n`, `datatable`) — a single `generateProject()` code path with `hasFeature()` checks, `normalizeFeatures()` and `computePermissions()` pure helpers
- **Datatable feature — insert form**: generated `Datatable.svelte` now includes an "Add item" form below the table (when `database` feature is enabled) with `name` and `value` fields, styled with core CSS variables and dark mode support
- **Datatable feature — row actions**: `createActionsColumn` with two actions per row: **Duplicate** (primary) and **Delete** (secondary, destructive/red) — delete uses `sdk.ui.dialog()` confirm modal
- **Datatable feature — full i18n**: all hardcoded strings replaced with `t()` calls; new translation keys (`datatable.columns.*`, `datatable.form.*`, `datatable.delete.*`, `datatable.success.*`, `datatable.error.*`, `datatable.duplicate`, `datatable.delete`)
- **Datatable feature — server functions**: generated `server/functions.ts` now exports `insertItem`, `deleteItem`, and `duplicateItem` — all use `app__${pluginId}` schema prefix from `context.pluginId`
- **All component templates — button styling**: `Notifications`, `Remote`, and `Datatable` components now use `btn-primary` class with CSS variables instead of unstyled native buttons

## [0.1.9] - 2026-04-10

### Fixed

- **Plugin uninstall — desktop shortcut cleanup**: uninstalling a plugin now deletes all desktop shortcuts pointing to that plugin from the database (for all users)
- **Plugin uninstall — open window cleanup**: the client-side uninstall flow now closes any open windows belonging to the uninstalled plugin before navigating back
- **Remote functions**: `query()` → `command()` migration for `chat.remote.ts` (getChatUsers, getConversations, getUnreadCount, getOnlineUsers, getCurrentUserId), `appRegistry.remote.ts` (getUserApps), and `plugins.remote.ts` (fetchPlugins, fetchPluginDetail)
- **Plugin Installer**: schema name prefix changed from `plugin_` to `app__`; `pool.query()` used instead of `db.execute()`; `prefixMigrationSchema` regex fixed
- **Plugin Installer**: invalid JSON email template files are now skipped with a warning instead of crashing the install
- **Email manager**: plugin template name validation now accepts `appId:templateName` format via regex
- **Remote function handler**: business logic errors now return HTTP 200 with `{ success: false }` instead of HTTP 500, so clients can handle them gracefully
- **Remote function handler**: server functions now receive a `pluginDb` pg-pool-compatible interface (`query`, `connect`) instead of the Drizzle ORM instance
- **Remote function handler**: `.ts` fallback for `server/functions` path (dev mode support)
- **Plugin menu API**: now also reads `layout` field from `manifest.json` and returns it alongside the menu data
- **PluginDialog**: supports `confirmLabel` and `confirmVariant` options from `DialogOptions`
- **Vite config**: `uploads/plugins/**` and `uploads/plugins-temp/**` excluded from file watcher

### Added

- **Plugin layout**: `PluginLayoutWrapper` now registers SDK `navigateTo`, `setActionBar`, and `clearActionBar` handlers — plugins can navigate between views and control the action bar via the SDK
- **Plugin layout**: `maxWidthClass` prop on `PluginLayoutWrapper` and `AppLayout` for per-plugin layout width control (read from `manifest.json` `layout` field)
- **Plugin layout**: action bar items set by the plugin via `sdk.ui.setActionBar()` are rendered in the layout header; cleared automatically on component navigation

### Added (`@elyos-dev/sdk@0.1.22`)

- **`UIService.navigateTo(component, props?)`**: navigate to a named component within the plugin layout
- **`UIService.setActionBar(items)`**: set action bar buttons for the current view
- **`UIService.clearActionBar()`**: clear the action bar
- **`ActionBarItem` type**: new interface for action bar button definitions (label, onClick, variant, icon, disabled)
- **`DialogOptions.confirmLabel`**: custom label for the confirm button
- **`DialogOptions.confirmVariant`**: visual variant (`default` | `destructive`) for the confirm button
- **Exports**: `DialogOptions`, `DialogResult`, `ActionBarItem` now exported from the main SDK entry point

### Fixed (`@elyos-dev/create-app@0.1.10`)

- **Generated project dependencies**: `@lucide/svelte` bumped from `^0.561.0` to `^1.0.0` in scaffolded `package.json`
- **Generated project dependencies**: `@elyos-dev/sdk` bumped from `^0.1.16` to `^0.1.22` in scaffolded `package.json`

## [0.1.8] - 2026-04-09

- **Minor bug fixes**

## [0.1.7] - 2026-04-08

### Added

- **Plugin Email Service**: remote function context now includes an `email` service (`context.email.send()`) for plugins with `notifications` permission — template names are automatically prefixed with the plugin ID (e.g. `'employee_welcome'` → `'ely-work:employee_welcome'`)
- **Plugin Installer — email template registration**: the installer reads `email-templates/*.json` files during plugin installation and registers them in `platform.email_templates` per locale, with `{appId}:{fileName}` type format
- **Plugin uninstall — email template cleanup**: removing a plugin now deletes its email template records from `platform.email_templates` (matched by `{appId}:%` prefix)
- **Template Registry — plugin template lookup**: `TemplateRegistry` now resolves `appId:templateName` format names from the database, enabling plugin-registered templates to be used by `EmailManager`

### Tests

- Property-based test for email template name prefixing (Property 10, validates Requirement 12.4)
- Unit tests for `PluginInstaller.importEmailTemplates()` and `removeEmailTemplates()` (validates Requirements 12.6, 12.10)

## [0.1.6] - 2026-04-08

### Fixed (`@elyos-dev/create-app@0.1.7`)

- **Sidebar template**: standalone dev mode now correctly displays translated text in content components — the mock SDK was using a closed-over `$state` reference that was not reactive; fixed by loading locale files in `main.ts` and passing them to `MockWebOSSDK.initialize()`
- **Sidebar template**: locale switching in standalone mode now updates content components immediately — `setLocale()` is now called synchronously before `currentLocale` state changes, ensuring the `{#key}` remount sees the correct locale
- **All templates** (`basic`, `advanced`, `datatable`, `sidebar`): `main.ts` now loads translations dynamically from `locales/*.json` files instead of hardcoding them — locale files are the single source of truth
- **Sidebar template components** (`Overview`, `Settings`): removed `tr` state object boilerplate and `$effect`-based i18n loading; components now use `sdk.i18n.t(key)` directly, consistent with other templates
- **Starter template generator**: `generateBlankMainTs` now always uses locale file loading when `blankI18n` is enabled, regardless of `blankSidebar` option
- **Starter template generator**: `generateBlankOverviewSvelte` now generates components with `sdk.i18n.t()` pattern instead of static text

## [0.1.5] - 2026-04-07

### Fixed

- Dev plugin loader: allow `host.docker.internal` URLs for Docker-hosted ElyOS instances
- Dev plugin loader: browser receives `localhost` URL (converted from `host.docker.internal`) so the plugin loads correctly from both server and client side
- Dev plugin window now gets focus after async loading completes
- Dev plugin loader UI strings are now fully localized (i18n keys, Docker hint added)

### Added

- New translation keys for the Dev Plugin Loader panel (hu/en)

## [0.1.0] - 2026-03-07

### Added

- Initial public release of ElyOS
- Full desktop environment in the browser with window management, taskbar, and start menu
- Built-in applications: Settings, Users, Log, Plugin Manager, Chat, Notifications, Help
- Plugin system with WebOS SDK for third-party app development _(in development)_
- Authentication system with email/password, OTP, Google sign-in, and 2FA (TOTP)
- Database-backed internationalization (i18n) with runtime locale switching
- Real-time chat via Socket.IO
- Dark/Light mode support
- Docker Compose setup for self-hosting
- Comprehensive documentation and troubleshooting guides

### Documentation

- Configuration guide for environment variables
- Troubleshooting guide for common setup issues (English and Hungarian)
- Contributing guide
- Project structure documentation
