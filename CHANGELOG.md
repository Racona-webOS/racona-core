# Changelog

[🇭🇺 Magyar verzió](./CHANGELOG_HU.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-10-06

### Added

- **Plugin email reply-to**: `context.email.send()` accepts an optional `replyTo` parameter, so a plugin can set the Reply-To address per email. When omitted, the system-wide `SMTP_REPLY_TO` applies as before.
- **Mobile shell**: on phones a simple mobile interface replaces the desktop (windows, taskbar). One app is shown at a time, full screen; the bottom bar has home, notifications, open apps and profile (dark mode, sign out). The view lives in the browser history, so the phone's back gesture returns to the previous view.
  - The server picks the shell from the user agent: phone → mobile, everything else (tablets included) → desktop. Narrowing a desktop browser does not switch to mobile. It can be switched by hand (Profile → "Desktop view", and back from the start menu on a phone); the choice is kept in the `racona_shell` cookie.
  - On mobile only what was built for mobile is shown; the window manager does not save window sizes there, so phone use does not overwrite the desktop ones.
- **Mobile entries in the plugin manifest** (`mobile.entries`: `id`, `label`, `icon`, `component`): plugin screens that open on their own as quick actions on mobile. The core validates them (kebab-case, unique IDs, at most 12) and stores them in `platform.apps.mobile` (migration `0012_app_mobile`). A notification opens the app on mobile when its data has a `mobileEntry` pointing to an entry.
- **Direct link to an app**: `/admin?app=<app>&entry=<mobile entry>` or `&section=<menu item>` (e.g. from emails). Only apps the user can access are opened; on desktop the entry's screen opens in the app window. When signed out, the sign-in page keeps the requested address (`?redirectTo=`) and returns there after signing in; only addresses under `/admin` are accepted.
- **SDK**: `sdk.context.shell` (`'desktop' | 'mobile'`) tells a plugin which interface it runs in (`@racona/sdk` 0.8.0).

### Changed

- **One session per device type**: a user can have one desktop and one mobile session at the same time; signing in on a phone no longer signs out the desktop. A new sign-in only removes the session of the same type; old sessions without a type count as desktop (migration `0011_session_device_type`: `auth.sessions.device_type`, an index on `user_id`, `user_agent` is now `text`).
- The sign-in page is full width on phones, its height no longer jumps with the mobile address bar, and it avoids the notch (`viewport-fit=cover`).
- The start menu no longer overflows the screen.
- For developers: the shared startup (`ShellRuntime`) and the window content (`WindowContent`) are separate components, used by both the desktop and the mobile shell.
- When upgrading: `db:migrate` (or the Docker `db:init`) runs the new migrations; the mobile interface texts are the `mobile.*` keys of the `desktop` namespace (`translations_desktop` seed).

### Fixed

- In development, signing in from a phone on the local network (`vite dev --host`, port 3000) no longer fails with "Invalid origin".
- Plugin translations are loaded before the plugin is shown (waiting at most 3 seconds). Previously anything rendered before they arrived stayed as a raw key (e.g. `loading`).

## [0.5.0] - 2026-10-06

### Added

- **Scheduler**: plugins can declare scheduled jobs in their manifest (`scheduledJobs` + `scheduler` permission, handlers in `server/jobs.ts`). The scheduler runs inside the app process, keeps its state in the database (`platform.scheduled_jobs`, `platform.scheduled_job_runs`) and locks jobs with `FOR UPDATE SKIP LOCKED`, so a job runs once even with several app instances. Missed runs are caught up after a restart (`catchUp: 'once'`).
  - Plugin Manager: new "Scheduled Jobs" page and a section on the plugin detail page — next/last run, enable/disable, "Run now", run history with logs. New permission: `plugin.scheduler.manage`.
  - Core maintenance jobs now run daily: old scheduler runs, email logs older than 90 days, abandoned plugin uploads and plugin update backups older than 7 days.
  - Configuration: `SCHEDULER_*` environment variables (see docs/CONFIGURATION.md).
- **Plugin file storage**: plugins with the `file_access` permission get `context.files` in remote functions and scheduled jobs (`save`, `get`, `read`, `delete`, `claim`, `createUploadUrl`, `createDownloadUrl`). Files are stored on disk under `uploads/plugin-files/{pluginId}/`, metadata in `platform.plugin_files` (migration `0009_plugin_files`). The plugin decides who may upload or download; the browser uses short-lived signed links bound to the user (`POST /api/plugins/:pluginId/files/upload/:token`, `GET /api/plugins/:pluginId/files/download/:token`), the file type is detected from the content. Files are kept when the plugin is uninstalled.
  - New core job `core.plugin-files-cleanup`: deletes uploads that were never attached (after 24 hours) and partial uploads.
  - Configuration: `PLUGIN_FILE_MAX_BYTES` (default 10 MiB). Back up the whole `uploads` folder.
  - Dev server: Vite no longer watches `uploads/plugin-files/`, so an upload does not reload the page.

### Changed

- `/api/files/list` only lists the core categories (`backgrounds`, `documents`, `avatars`, `images`) and rejects path characters in `type`; before, `../` in the parameters could list any folder under `uploads`. `/api/files/...` never serves `plugin-files/`, and the core `saveFile` rejects the reserved categories `plugins` and `plugin-files`.
- The email and i18n services start when the server starts (SvelteKit `init` hook), not on the first request, so scheduled jobs can send email without a prior request.
- **Core file storage** (`saveFile`, `deleteFile`, `/api/files/...`):
  - Uploading to and deleting from the `shared` scope needs the new `files.shared.manage` permission (new `files` resource; Sysadmin and Admin by default). Before, any logged-in user could upload shared files, and nobody could delete them. Migration `0010_files_shared_manage` adds the permission to existing databases and grants it to every role and group that has `settings.update`.
  - `/api/files/...` sends `Cache-Control: private` (was `public`), so proxies and CDNs do not keep files that need a login.
  - The `Content-Type` comes from the MIME type stored in `platform.files` (detected from the content at upload); the file extension only counts for files without a row. HTML, JavaScript, SVG and XML are always served as `application/octet-stream` with `Content-Disposition: attachment`; only images, audio, video, PDF and plain text are shown inline.
  - The upload size limit follows `BODY_SIZE_LIMIT`: the file travels base64-encoded, so about three quarters of the body limit is usable. The `FileUploader` default is 7 MB (was 10 MB, which failed between 7.5 and 10 MB), `saveFile` checks the size, and the uploader shows a clear message when the server rejects the request size.
  - SVG and BMP were removed from the allowed image types: SVG is not detected from the content and could run scripts, BMP cannot be read by `sharp`; both uploads always failed.
  - The `src/lib/server/storage/*.remote.ts` duplicates were removed; the remote functions live in `src/lib/storage/` (`getFileMetadata` moved there).

### Fixed

- **DatePicker**: a value set from outside (e.g. prefilled from another field) was immediately overwritten by the calendar's previous value, and could end in an endless update loop (`effect_update_depth_exceeded`). Both directions now react only to their own side's change.
- Deleting an own background (`deleteBackground`) also deletes its `platform.files` row; before, only the files on disk were removed.
- Thumbnails are named after the stored file (`thumb-{filename}`), so they match when the uploaded name had to be made unique; `/api/files/list` does not list `thumb-` files; storage paths and `thumbnailUrl` always use `/` (they had `\` on Windows). An uploaded file can no longer start with `thumb-`.
- After uploading a background, the settings use the stored file name, not the original one (which broke for names with spaces or accents).
- New core job `core.orphan-files-cleanup` (daily): deletes the personal files of deleted users. Deleting a user sets `platform.files.user_id` to null, and these files were left on disk without any way to reach them.

## [0.4.1] - 2026-04-27

### Fixed

- **AI Assistant**: requests to the Anthropic API no longer send `temperature` and `top_p` together (the API rejects them together); only `temperature` is sent, both in chat and in the connection test.
- **AI Assistant**: the "Clear conversation" button label is translated (it was hard-coded in Hungarian).
- **Database**: removed the duplicate `aiAgentConfigs` export from the `ai-providers` schema, which broke the build (`aiAgentConfigs is not exported by @racona/database/schemas`).
- **Docker**: the image builds again with Bun 1.3.13 (updated lockfile, `--frozen-lockfile` kept, no extra TypeScript install that modified the lockfile, only workspace plugin examples copied).

## [0.4.0] - 2026-04-27

### Added

- **AI Assistant**: Complete AI-powered assistant system with chat interface, knowledge base integration, and customizable AI avatars
  - Multi-provider support (OpenAI, Anthropic, Google Gemini)
  - Text-to-Speech (TTS) with browser and ElevenLabs providers
  - Knowledge base search with vector embeddings
  - AI avatar installation and management
  - Global admin configuration for AI agent and TTS settings
  - Real-time chat interface with message history
  - Configurable AI parameters (temperature, max tokens, top-p)
- **Authentication Settings**: Admin panel for managing authentication options
  - Toggle registration on/off from Settings app
  - Toggle social login (Google) on/off from Settings app
  - Database-backed configuration (replaces environment variables)
  - Auto-save on toggle for better UX

### Changed

- Authentication configuration moved from environment variables to database
- `REGISTRATION_ENABLED` and `SOCIAL_LOGIN_ENABLED` env variables deprecated (now managed via Settings > Authentication)

### Fixed

- Button component: restored missing `login` variant
- IconButton and ButtonSave components: added `disabled` prop support

## [0.3.2] - 2026-04-15

### Changed

- Brand name and documentation updates

### Changed (`@racona/sdk@0.3.2`)

- Brand name and documentation updates

### Changed (`@racona/cli@0.3.2`)

- Brand name and documentation updates

## [0.3.0] - 2026-04-14

### Changed — Racona brand migration (2026-04-14)

- **Project renamed**: Racona → Racona
- **`create-elyos-app`** → **`@racona/cli`** — CLI tool for scaffolding plugins
- **`@elyos/sdk`** / **`@elyos-dev/sdk`** → **`@racona/sdk`** — plugin SDK
- All UI text, documentation, and configuration references updated from Racona to Racona
- Domain updated: `elyos.hu` → `racona.hu` (301 redirects in place)

## [0.2.2] - 2026-04-12

### Fixed

- **Start menu close on outside click**: clicking anywhere outside the start menu panel now correctly closes it — worked around a bits-ui `DismissibleLayer` limitation where clicks on `ContextMenu.Trigger` elements (the desktop workspace) were excluded from outside-click detection

## [0.2.1] - 2026-04-12

### Fixed

- **Dev plugin loader**: default URL changed from `http://localhost:5174` to `http://localhost:5175` (the remote dev server port)
- **Dev plugin remote calls**: remote function calls from dev plugins now proxy to the dev server (`devUrl`) instead of the core API endpoint (which has no DB entry for dev plugins)

### Added (`@elyos-dev/sdk@0.2.1`)

- **`SimpleDataTable` component**: standalone-mode DataTable without TanStack Table dependency — supports pagination, sorting, toolbar snippet, and action buttons
- **`SimpleRowActions` component**: primary button + dropdown for secondary actions — simulates the core `DataTableRowActions` component in standalone mode
- **`MockWebOSSDK.initialize()`**: now accepts `extraComponents` parameter — pass `{ DataTable: SimpleDataTable }` to register the standalone table before app mount
- **`WebOSComponents` interface**: typed fields for `DataTable`, `DataTableColumnHeader`, `renderComponent`, `renderSnippet`, `createActionsColumn`, `Input`, `Button`
- **`MockUIService`**: `components` now includes `createActionsColumn`, `renderComponent`, `renderSnippet`, `DataTableColumnHeader` mock implementations out of the box
- **SDK exports**: `SimpleDataTable.svelte` and `SimpleRowActions.svelte` exported via `@elyos-dev/sdk/dev/components/SimpleDataTable.svelte`

### Added (`@elyos-dev/create-app@0.2.2`)

- **DataTable standalone support**: generated `Datatable.svelte` now imports `SimpleDataTable` directly and uses it in standalone mode; in core mode the real `DataTable` is used via `svelte:component`
- **`getItems` server function**: generated `server/functions.ts` now exports `getItems` with server-side pagination and sorting
- **`loadData` via `remote.call`**: data loading uses `sdk.remote.call('getItems', ...)` instead of `sdk.data.query()` — works in both standalone and core modes
- **`handleStateChange` triggers reload**: pagination and sorting changes now call `loadData()` automatically
- **`<script module lang="ts">`**: fixed esbuild parse error on first `dev:full` start — all component module blocks now declare TypeScript language

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

- Dev plugin loader: allow `host.docker.internal` URLs for Docker-hosted Racona instances
- Dev plugin loader: browser receives `localhost` URL (converted from `host.docker.internal`) so the plugin loads correctly from both server and client side
- Dev plugin window now gets focus after async loading completes
- Dev plugin loader UI strings are now fully localized (i18n keys, Docker hint added)

### Added

- New translation keys for the Dev Plugin Loader panel (hu/en)

## [0.1.0] - 2026-03-07

### Added

- Initial public release of Racona
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
