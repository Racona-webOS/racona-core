# Changelog — @racona/sdk

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-05-07

### Added

- **`Checkbox` komponens** a `WebOSComponents` interfészben: a core rendszer shadcn-svelte alapú Checkbox komponense elérhető a pluginok számára `sdk.components.Checkbox` alatt. Bits-UI (`Checkbox.Root`) alapú, `checked` bindingot és `onCheckedChange` callback-et használ. A komponens automatikusan örökli a core téma színeit (primary, border, focus ring). Standalone dev módban (Mock SDK) natív `<input type="checkbox">` a fallback.

## [0.3.3] - 2026-05-06

### Added

- **`DatePicker` komponens** a `WebOSComponents` interfészben: dátum kiválasztó komponens, amelyet a core rendszer biztosít a pluginok számára az SDK-n keresztül (`sdk.components.DatePicker`)
- A `DatePicker` a shadcn-svelte `Calendar` + `Popover` kompozícióra épül, `@internationalized/date` alapú dátumkezeléssel
- `value` prop: ISO 8601 string (`YYYY-MM-DD`) kötés, `locale` prop: megjelenítési nyelv, `minValue`/`maxValue`: dátum korlátok

## [0.3.2] - 2026-04-15

### Changed

- Brand name and documentation updates

## [0.3.1] - 2026-04-14

### Fixed

- README updated to reflect `@racona/sdk` package name and `racona.hu` links

## [0.3.0] - 2026-04-14

### Changed

- **Package renamed**: `@racona/sdk` → `@racona/sdk`
- All import paths updated from `@racona/sdk` to `@racona/sdk`

## [0.2.2] - 2026-04-12

### Fixed

- Restored missing `exports` field in `jsr.json` (broken in 0.2.1)

### Added

- **`SimpleDataTable` component** (`@racona/sdk/dev/components/SimpleDataTable.svelte`): standalone DataTable without TanStack Table — pagination, sorting, toolbar snippet, action buttons, `{@html}` cell rendering
- **`SimpleRowActions` component** (`@racona/sdk/dev/components/SimpleRowActions.svelte`): primary button + dropdown for secondary actions — simulates core `DataTableRowActions`
- **`MockWebOSSDK.initialize(config, extraComponents?)`**: new `extraComponents` parameter — pass `{ DataTable: SimpleDataTable }` to register the standalone table synchronously before app mount
- **`WebOSComponents` interface**: typed fields for `DataTable`, `DataTableColumnHeader`, `renderComponent`, `renderSnippet`, `createActionsColumn`, `Input`, `Button`
- **`MockUIService` components**: `createActionsColumn`, `renderComponent`, `renderSnippet`, `DataTableColumnHeader` mock implementations included by default
- **SDK package exports**: `./dev/components/SimpleDataTable.svelte` and `./dev/components/SimpleRowActions.svelte` explicit export entries

### Changed

- Version bump to align all Racona packages at `0.2.0`
- No breaking changes — fully compatible with `0.1.x`

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
- **Exports**: `DialogOptions`, `DialogResult`, `ActionBarItem` now exported from the main entry point (`@racona/sdk`)

## [0.1.21] - 2026-04-09

### Fixed

- JSDoc coverage improvements across `UIService`, `SharedLibrariesService`, `MockAssetService`
- `MockSharedLibrariesService` exported from `@racona/sdk/dev`
- Explicit documented constructors added to classes with implicit constructors (`MockNotificationService`, `MockUIService`)
- Removed undocumentable `I`-prefixed type aliases from main entry point (JSR compatibility)
- Explicit return types added to `SharedLibrariesService` getters

## [0.1.16] - 2026-03-20

### Fixed

- Package name restored to `@racona/sdk` (was temporarily renamed)
- All internal SDK imports updated to match the restored package name

## [0.1.15] - 2026-03-15

### Changed

- JSDoc improvements and JSR score optimizations across multiple versions (0.1.13 – 0.1.15)
- Repository URL corrected for npm provenance
- JSR publish workflow added

## [0.1.1] - 2026-03-08

### Added

- Initial public release of `@racona/sdk`
- Runtime SDK: `WebOSSDK`, `UIService`, `NotificationService`, `I18nService`, `AssetService`, `SharedLibrariesService`, `StorageService`
- Dev SDK (`@racona/sdk/dev`): `MockWebOSSDK` and all mock service implementations for standalone plugin development
- Type definitions (`@racona/sdk/types`): `DialogOptions`, `DialogResult`, `ToastType`, `WebOSComponents`, and more
- JSR publish support
