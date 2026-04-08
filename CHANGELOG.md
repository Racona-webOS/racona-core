# Changelog

[🇭🇺 Magyar verzió](./CHANGELOG_HU.md)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
