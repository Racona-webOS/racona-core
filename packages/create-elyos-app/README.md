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

# With a name and template
bunx @elyos-dev/create-app my-app --template advanced

# Skip dependency installation
bunx @elyos-dev/create-app my-app --no-install
```

## Templates

### `basic`

A minimal plugin with a single Svelte component and SDK integration. Good starting point for simple UI plugins.

```
my-plugin/
├── src/
│   ├── App.svelte          # Main component
│   └── main.ts             # Entry point with SDK init
├── locales/
│   ├── en.json             # English translations
│   └── hu.json             # Hungarian translations
├── assets/
│   └── icon.svg            # Plugin icon
├── manifest.json           # Plugin metadata
├── package.json            # Dependencies (@elyos/sdk)
├── vite.config.ts          # Build configuration
└── .gitignore
```

### `advanced`

Includes server-side functions and a settings component. Use this when your plugin needs backend logic.

```
my-plugin/
├── src/
│   ├── App.svelte
│   ├── main.ts
│   └── components/
│       └── Settings.svelte # Settings panel
├── server/
│   └── functions.ts        # Server-side remote functions
├── locales/
├── assets/
├── manifest.json
├── package.json
├── vite.config.ts
└── .gitignore
```

### `datatable`

Full CRUD application with DataTable integration and server functions. Ideal for data-driven plugins.

```
my-plugin/
├── src/
│   ├── App.svelte
│   ├── main.ts
│   └── components/
│       ├── DataTableView.svelte  # DataTable with sorting/filtering
│       └── columns.ts            # Column definitions
├── server/
│   └── functions.ts              # CRUD operations
├── locales/
├── assets/
├── manifest.json
├── package.json
├── vite.config.ts
└── .gitignore
```

## Options

| Flag                        | Description                                | Default    |
| --------------------------- | ------------------------------------------ | ---------- |
| `[plugin-name]`             | Plugin ID in kebab-case                    | (prompted) |
| `-t, --template <template>` | Template: `basic`, `advanced`, `datatable` | (prompted) |
| `--no-install`              | Skip `bun install` after generation        | `false`    |
| `-V, --version`             | Show CLI version                           |            |
| `-h, --help`                | Show help                                  |            |

## Interactive Wizard

When run without flags, the CLI walks you through an interactive setup:

1. **Plugin ID** — kebab-case identifier (e.g., `my-plugin`)
2. **Display Name** — human-readable name shown in ElyOS
3. **Description** — short description of the plugin
4. **Author** — your name and email
5. **Template** — choose from basic, advanced, or datatable
6. **Permissions** — select required permissions (database, notifications, remote functions)

## Development Workflow

After scaffolding:

```bash
cd my-plugin

# Start standalone dev server (uses mock SDK)
bun dev

# Build for production
bun run build

# Test inside ElyOS (requires Docker)
# 1. Start ElyOS: docker compose up -d
# 2. Open Plugin Manager → "Load Dev Plugin"
# 3. Enter: http://localhost:5174
```

## Generated Files

### `manifest.json`

Plugin metadata used by ElyOS to register and display your plugin. Includes name, description, permissions, window size constraints, supported locales, and more.

### `package.json`

Pre-configured with `@elyos/sdk` as a dependency and Vite build scripts.

### `vite.config.ts`

Configured to build your plugin as an IIFE bundle (`dist/index.iife.js`) compatible with ElyOS's plugin loader.

## Further Reading

- [ElyOS Documentation for users](https://docs.elyos.hu)

## License

MIT

---

## Changelog

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
- **Fix**: Generator produces `sdk.i18n.t()` pattern in blank components instead of static text

### [0.1.5] - 2026-03-20

- **Fix**: SDK dependency updated to `@elyos-dev/sdk@^0.1.16`

### [0.1.3] - 2026-03-10

- **Added**: Starter template (`--template starter`) with blank scaffold generator

### [0.1.0] - 2026-03-07

- Initial release — interactive CLI scaffolding for ElyOS plugins
