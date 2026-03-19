# @elyos-dev/sdk

The official SDK for building [ElyOS](https://elyos.hu) apps. Provides runtime services (injected by ElyOS), a mock SDK for standalone development, and full TypeScript type definitions.

<a href="https://www.npmjs.com/package/@elyos-dev/sdk"><img src="https://img.shields.io/npm/v/@elyos-dev/sdk?color=blue" alt="npm version" /></a>
<a href="https://jsr.io/@elyos-dev/sdk"><img src="https://jsr.io/badges/@elyos-dev/sdk" alt="JSR" /></a>
<a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>

## Installation

```bash
# npm / bun
bun add @elyos-dev/sdk

# JSR (Deno / Bun / Node)
bunx jsr add @elyos-dev/sdk
# or
deno add jsr:@elyos-dev/sdk
```

## Package Exports

| Export                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `@elyos-dev/sdk`       | Runtime SDK (injected by ElyOS at load time) |
| `@elyos-dev/sdk/dev`   | Mock SDK for standalone development          |
| `@elyos-dev/sdk/types` | TypeScript type definitions only             |

## Quick Start

### Runtime Mode (inside ElyOS)

When your app runs inside ElyOS, the SDK is automatically injected into `window.webOS`:

```ts
const sdk = window.webOS!;

sdk.ui.toast('Hello from my app!', 'success');

const user = sdk.context.user;
console.log(`Logged in as ${user.name}`);
```

### Development Mode (standalone)

For local development without a running ElyOS instance, use the mock SDK:

```ts
// src/main.ts
import { MockWebOSSDK } from '@elyos-dev/sdk/dev';

if (!window.webOS) {
	MockWebOSSDK.initialize({
		context: {
			pluginId: 'my-app',
			user: { id: '1', name: 'Dev User', email: 'dev@example.com', roles: ['admin'], groups: [] }
		},
		i18n: {
			locale: 'en',
			translations: {
				en: { greeting: 'Hello, {name}!' },
				hu: { greeting: 'Szia, {name}!' }
			}
		}
	});
}

const sdk = window.webOS!;
sdk.ui.toast('Running in dev mode', 'info'); // → logs to console
```

The mock SDK simulates all services locally:

- Toasts and dialogs log to the browser console
- Data storage uses `localStorage`
- Remote calls can be configured with custom handlers
- i18n works with provided translation maps

### Types Only

```ts
import type { WebOSSDKInterface, UIService, DataService } from '@elyos-dev/sdk/types';
```

## API Overview

### `ui` — UI Service

```ts
sdk.ui.toast('Saved!', 'success', 3000);
const result = await sdk.ui.dialog({ title: 'Confirm', message: 'Delete?', type: 'confirm' });
const theme = sdk.ui.theme; // Current theme colors
const components = sdk.ui.components; // ElyOS UI components
```

### `data` — Data Service

```ts
await sdk.data.set('settings', { darkMode: true });
const settings = await sdk.data.get<{ darkMode: boolean }>('settings');
await sdk.data.delete('settings');

// SQL queries (requires `database` permission)
const rows = await sdk.data.query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Transactions
await sdk.data.transaction(async (tx) => {
	await tx.query('INSERT INTO items (name) VALUES ($1)', ['New Item']);
	await tx.commit();
});
```

### `remote` — Remote Service

```ts
const result = await sdk.remote.call<{ items: Item[] }>('getItems', { page: 1 });
const saved = await sdk.remote.call('saveItem', { name: 'Test' }, { timeout: 5000 });
```

### `i18n` — Internationalization Service

```ts
const label = sdk.i18n.t('greeting', { name: 'World' }); // "Hello, World!"
const currentLocale = sdk.i18n.locale; // "en"
await sdk.i18n.setLocale('hu');
await sdk.i18n.ready(); // Wait for translations to load
```

### `notifications` — Notification Service

```ts
// Requires `notifications` permission
await sdk.notifications.send({
	userId: 'user-123',
	title: 'New message',
	message: 'You have a new message',
	type: 'info'
});
```

### `context` — Context Service

```ts
const pluginId = sdk.context.pluginId;
const user = sdk.context.user; // { id, name, email, roles, groups }
const params = sdk.context.params; // Parameters passed when opening the app
const perms = sdk.context.permissions; // ['database', 'notifications', ...]

sdk.context.window.setTitle('My App — Settings');
sdk.context.window.close();
```

### `assets` — Asset Service

```ts
const iconUrl = sdk.assets.getUrl('icon.svg');
const imageUrl = sdk.assets.getUrl('images/banner.png');
```

## TypeScript Support

All service interfaces are exported from `@elyos-dev/sdk/types`:

```ts
import type {
	WebOSSDKInterface,
	UIService,
	RemoteService,
	DataService,
	I18nService,
	NotificationService,
	ContextService,
	AssetService,
	UserInfo,
	ThemeColors,
	DialogOptions,
	DialogResult,
	ToastType,
	MockSDKConfig,
	PluginErrorCode
} from '@elyos-dev/sdk/types';
```

## Further Reading

For user documentation, visit [docs.elyos.hu](https://docs.elyos.hu).

## License

MIT
