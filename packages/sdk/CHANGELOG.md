# Changelog — @racona/sdk

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-10-06

### Added

- **`sdk.context.shell`** (`'desktop' | 'mobile'`) és a `ShellMode` típus: melyik felületen fut az app. Telefonon (`mobile`) a core egyszerre egy appot mutat teljes képernyőn, jellemzően a manifest `mobile.entries` bejegyzéseinek egyik komponensével. A core mobil keretet tartalmazó verziója kell hozzá; régebbi core-on mindig `desktop`. Standalone módban a `MockSDKConfig.context.shell` állítja (alapból `desktop`).
- **`@racona/sdk/server`**: `PluginEmailService.send()` opcionális `replyTo` paramétere (Reply-To cím). A core ezt támogató verziója kell hozzá; régebbi core figyelmen kívül hagyja.

## [0.7.0] - 2026-10-06

### Added

- **`sdk.files.upload(uploadUrl, file, { onProgress, signal })`**: fájl feltöltése a core fájltárolójába a plugin szerver kódja által kiadott, aláírt linkre (`context.files.createUploadUrl`). A fájl nyersen megy (nem base64), haladásjelzéssel; hibánál `FileUploadError` `code`-dal (`FILE_TOO_LARGE`, `INVALID_MIME`, …). Típusok: `FileService`, `FileUploadResult`, `FileUploadOptions`, `FileUploadError`. Standalone módban a `MockFileService` szimulálja (`MockSDKConfig.files.upload`).
- **`@racona/sdk/server`**: `PluginFileService`, `PluginFileInfo`, `PluginFileError`, és `files?` a `RemoteFunctionContext`-ben és a `ScheduledJobContext`-ben (`file_access` jogosultsággal). A fájlok a lemezre kerülnek, az adatbázisba csak a metaadat. A core `file_access`-t támogató verziója kell hozzá.

## [0.6.0] - 2026-10-05

### Added

- **`@racona/sdk/server`**: típusok a plugin szerver kódjához. Ütemezett feladatok: `ScheduledJobHandler`, `ScheduledJobContext`, `ScheduledJobParams`, `ScheduledJobResult`, `ManifestScheduledJob`. Remote függvények: `RemoteFunctionContext`. Szolgáltatások: `PluginDb`, `PluginEmailService`, `PluginNotificationService`. Csak típusok, futásidejű kód nincs benne. Az ütemezett feladatokhoz a core ütemezőt tartalmazó verziója kell.
- **`WebOSComponents.DataTableRowActions`**: a `createActionsColumn` által renderelt elsődleges gomb + ⋮ menü csoport táblázaton kívüli listákhoz. Standalone módban nem érhető el.

### Changed

- Dokumentáció: a `NotificationOptions.userId` és a README leírja, hogy kliens oldalról a felhasználó mindig értesítheti saját magát, más felhasználót viszont csak a core `notifications.send` jogosultsággal (különben `PERMISSION_DENIED`). Más felhasználók értesítésére a szerver függvényekben a `context.notifications.send()` való.

## [0.5.1] - 2026-09-09

### Changed

- Dokumentáció: a README changelog szekciója megkapta a `0.5.0` bejegyzést. A registryk a csomagba épített READMEt jelenítik meg, ezért a `0.5.0` oldalára az még nem került fel — ez a patch pótolja. Kódváltozás nincs benne.

## [0.5.0] - 2026-09-09

> Ez az első kiadás, amely a `DatePicker` (0.3.3) és a `Checkbox` (0.4.0)
> komponenst is elviszi a registrykbe: azok a verziók a changelogban szerepeltek,
> de nem lettek publikálva. A legutóbbi publikált verzió a 0.3.2 volt.

### Added

- **Típus-exportok a csomag gyökeréből**: `UserInfo`, `WindowControls`, `ThemeColors`, `CallOptions`, `Transaction`, `NotificationOptions`, `ToastType`, `WebOSComponents`, `WebOSSDKInterface`, `MockSDKConfig`. Eddig csak a `DialogOptions`, `DialogResult` és `ActionBarItem` volt elérhető, a többi típust a plugin szerzők nem tudták importálni.
- **`ActionBarItem.size`**: gombméret az action bar elemeihez.
- **`WebOSComponents.Checkbox` és `WebOSComponents.DatePicker`**: a core rendszer Checkbox és DatePicker komponense (lásd a 0.4.0 és 0.3.3 bejegyzést).

### Fixed

- **`renderComponent` és `renderSnippet` típusa**: a paraméterek `unknown` helyett `any`. Az `unknown` paraméter azt ígérte, hogy a függvény bármit elfogad, a core-beli (bits-ui) implementáció viszont generikus `Component<T>`-et, illetve `Snippet<[TProps]>`-et vár — kontravariancia miatt nem volt értékadható a mezőre.
- **`ActionBarItem.size` értékkészlete**: a korábbi `'xl'` méretet a core Button soha nem támogatta, az azt használó gomb méretosztály nélkül renderelődött. A típus mostantól a Button tényleges méreteit tükrözi: `'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'`.

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
