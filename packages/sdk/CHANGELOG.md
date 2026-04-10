# Changelog — @elyos-dev/sdk

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.23] - 2026-04-10

### Changed

- Changelog added to README for visibility on npmjs.com and jsr.io

## [0.1.22] - 2026-04-10

### Added

- **`UIService.navigateTo(component, props?)`**: navigate to a named component within the plugin layout (requires sidebar/menu-based plugin)
- **`UIService.setActionBar(items)`**: set action bar buttons for the current view
- **`UIService.clearActionBar()`**: clear the action bar
- **`ActionBarItem` type**: new interface for action bar button definitions (`label`, `onClick`, `variant`, `icon`, `disabled`)
- **`DialogOptions.confirmLabel`**: custom label for the confirm button in `confirm`-type dialogs
- **`DialogOptions.confirmVariant`**: visual variant (`default` | `destructive`) for the confirm button
- **Exports**: `DialogOptions`, `DialogResult`, `ActionBarItem` now exported from the main entry point (`@elyos-dev/sdk`)

## [0.1.21] - 2026-04-09

### Fixed

- JSDoc coverage improvements across `UIService`, `SharedLibrariesService`, `MockAssetService`
- `MockSharedLibrariesService` exported from `@elyos-dev/sdk/dev`
- Explicit documented constructors added to classes with implicit constructors (`MockNotificationService`, `MockUIService`)
- Removed undocumentable `I`-prefixed type aliases from main entry point (JSR compatibility)
- Explicit return types added to `SharedLibrariesService` getters

## [0.1.16] - 2026-03-20

### Fixed

- Package name restored to `@elyos-dev/sdk` (was temporarily renamed)
- All internal SDK imports updated to match the restored package name

## [0.1.15] - 2026-03-15

### Changed

- JSDoc improvements and JSR score optimizations across multiple versions (0.1.13 – 0.1.15)
- Repository URL corrected for npm provenance
- JSR publish workflow added

## [0.1.1] - 2026-03-08

### Added

- Initial public release of `@elyos-dev/sdk`
- Runtime SDK: `WebOSSDK`, `UIService`, `NotificationService`, `I18nService`, `AssetService`, `SharedLibrariesService`, `StorageService`
- Dev SDK (`@elyos-dev/sdk/dev`): `MockWebOSSDK` and all mock service implementations for standalone plugin development
- Type definitions (`@elyos-dev/sdk/types`): `DialogOptions`, `DialogResult`, `ToastType`, `WebOSComponents`, and more
- JSR publish support
