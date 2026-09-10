# WebOS Plugin Fejlesztői Útmutató

## Gyors Kezdés

### 1. Új Plugin Projekt Létrehozása

```bash
# Másold le a hello-world példát
cp -r examples/plugins/hello-world examples/plugins/my-plugin

# Lépj be a könyvtárba
cd examples/plugins/my-plugin

# Telepítsd a függőségeket (beleértve a @racona/webos-sdk-types-ot is)
bun install
```

### 2. Manifest Módosítása

Szerkeszd a `manifest.json` fájlt:

```json
{
	"id": "my-plugin", // ⚠️ EGYEDI ID (kebab-case)
	"name": "My Awesome Plugin", // Plugin neve
	"version": "1.0.0", // Verzió
	"description": "My plugin description",
	"author": "Your Name <your@email.com>",
	"entry": "dist/index.js", // Ne változtasd
	"icon": "assets/icon.svg",
	"permissions": [
		"database", // Adatbázis hozzáférés
		"notifications", // Értesítések
		"remote_functions" // Szerver függvények
	],
	"dependencies": {
		"svelte": "^5.0.0",
		"lucide-svelte": "^0.263.1"
	},
	"minWebOSVersion": "2.0.0",
	"locales": ["hu", "en"]
}
```

### 3. Komponens Fejlesztése

Szerkeszd a `src/App.svelte` fájlt:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	// WebOS SDK elérése
	const sdk = window.webOS;

	// Állapotok
	let data = $state(null);

	onMount(async () => {
		// Toast üdvözlés
		sdk?.ui.toast('Plugin betöltve!', 'success');

		// Adatok betöltése
		data = await sdk?.data.get('myData');
	});

	async function saveData() {
		await sdk?.data.set('myData', { value: 'hello' });
		sdk?.ui.toast('Mentve!', 'success');
	}
</script>

<div class="container">
	<h1>{sdk?.i18n.t('title')}</h1>
	<button onclick={saveData}>Mentés</button>
</div>

<style>
	.container {
		padding: 2rem;
	}
</style>
```

### 4. Szerver Függvények (Opcionális)

Ha szükséged van szerver oldali logikára, szerkeszd a `server/functions.js` fájlt:

```javascript
export async function myServerFunction(params, context) {
	const { pluginId, userId, db } = context;

	// Adatbázis lekérdezés
	const result = await db.execute(`
    SELECT * FROM plugin_${pluginId}.my_table
  `);

	return {
		success: true,
		data: result.rows
	};
}
```

Hívás a kliensről:

```typescript
const result = await window.webOS.remote.call('myServerFunction', {
	param1: 'value'
});
```

### 5. Fordítások

Szerkeszd a `locales/hu.json` és `locales/en.json` fájlokat:

```json
{
	"title": "My Plugin",
	"save": "Mentés",
	"success": "Sikeres művelet"
}
```

Használat:

```typescript
const text = window.webOS.i18n.t('title');
```

### 6. Build és Package

```bash
# Build
bun run build

# Package készítése
bun run package
```

Ez létrehozza a `my-plugin.wospkg` fájlt.

### 7. Feltöltés

```bash
# API-n keresztül
curl -X POST http://localhost:5173/api/plugins/upload \
  -F "file=@my-plugin.wospkg"
```

Vagy használd az Admin UI-t a böngészőben.

---

## WebOS SDK API Referencia

### UI Service

```typescript
// Toast értesítés
window.webOS.ui.toast(message, type, duration);
// type: 'info' | 'success' | 'warning' | 'error'
// duration: milliszekundum (alapértelmezett: 3000)

// Dialógus
const result = await window.webOS.ui.dialog({
	title: 'Cím',
	message: 'Üzenet',
	type: 'confirm' // 'info' | 'confirm' | 'prompt'
});

// Komponensek
const { Button, Input, Card } = window.webOS.ui.components;

// Téma színek
const colors = window.webOS.ui.theme;
console.log(colors.primary); // #667eea
```

### Remote Service

```typescript
// Szerver függvény hívása
const result = await window.webOS.remote.call(
	'functionName',
	{ param1: 'value' },
	{ timeout: 30000 } // opcionális
);

// Automatikus retry 3x exponenciális backoff-fal
// Automatikus auth token csatolás
```

### Data Service

```typescript
// Kulcs-érték tárolás
await window.webOS.data.set('key', value);
const value = await window.webOS.data.get('key');
await window.webOS.data.delete('key');

// SQL lekérdezés (csak plugin sémában!)
const rows = await window.webOS.data.query('SELECT * FROM my_table WHERE id = $1', [123]);

// Tranzakció
await window.webOS.data.transaction(async (tx) => {
	await tx.query('INSERT INTO ...');
	await tx.query('UPDATE ...');
	await tx.commit();
});
```

### I18n Service

```typescript
// Fordítás
const text = window.webOS.i18n.t('key');

// Paraméterekkel
const text = window.webOS.i18n.t('welcome', { name: 'John' });
// welcome: "Üdvözöljük, {name}!"

// Aktuális nyelv
const locale = window.webOS.i18n.locale; // 'hu' | 'en'

// Nyelv váltás
await window.webOS.i18n.setLocale('en');
```

### Notification Service

```typescript
// Értesítés küldése
await window.webOS.notifications.send({
	userId: window.webOS.context.user.id,
	title: 'Cím',
	message: 'Üzenet',
	type: 'info' // 'info' | 'success' | 'warning' | 'error'
});

// Jogosultság szükséges: 'notifications'
// A bejelentkezett felhasználó mindig küldhet saját magának. Más userId célzásához
// a felhasználónak notifications.send core jogosultság kell (különben PERMISSION_DENIED).
// Más felhasználók értesítésére a szerver függvények context.notifications.send()-je való.
```

### Context Service

```typescript
// Plugin információk
const pluginId = window.webOS.context.pluginId;
const user = window.webOS.context.user;
const params = window.webOS.context.params;
const permissions = window.webOS.context.permissions;

// Ablak vezérlők
window.webOS.context.window.close();
window.webOS.context.window.setTitle('Új cím');
```

### Asset Service

```typescript
// Asset URL generálás
const iconUrl = window.webOS.assets.getUrl('icon.svg');
const imageUrl = window.webOS.assets.getUrl('images/logo.webp');

// Használat HTML-ben
<img src={window.webOS.assets.getUrl('icon.svg')} alt="Icon" />
```

---

## Projekt Struktúra

```
my-plugin/
├── manifest.json          # ⚠️ KÖTELEZŐ - Plugin metaadatok
├── package.json           # Bun dependencies
├── vite.config.js         # Build konfiguráció
├── build-package.js       # Package script
│
├── src/
│   └── App.svelte         # ⚠️ KÖTELEZŐ - Fő komponens
│
├── server/                # Opcionális
│   └── functions.js       # Szerver oldali függvények
│
├── locales/               # Opcionális
│   ├── hu.json
│   └── en.json
│
└── assets/                # Opcionális
    └── icon.svg           # Plugin ikon
```

---

## Manifest Fájl Részletesen

```json
{
	// ⚠️ KÖTELEZŐ MEZŐK
	"id": "my-plugin", // Egyedi azonosító (kebab-case, csak a-z, 0-9, -)
	"name": "My Plugin", // Megjelenítendő név
	"version": "1.0.0", // Szemantikus verzió (major.minor.patch)
	"description": "...", // Rövid leírás
	"author": "Name <email>", // Szerző (email kötelező)
	"entry": "dist/index.js", // Belépési pont (ESM modul)
	"icon": "assets/icon.svg", // Ikon fájl
	"permissions": [], // Jogosultságok listája

	// OPCIONÁLIS MEZŐK
	"dependencies": {}, // Külső függőségek (csak fehérlistán lévők)
	"minWebOSVersion": "2.0.0", // Minimális WebOS verzió
	"locales": ["hu", "en"] // Támogatott nyelvek
}
```

### Engedélyezett Függőségek (Fehérlista)

- `svelte` (^5.x.x)
- `lucide-svelte` (^0.x.x)
- `@racona/*` (minden verzió)

Más függőségek NEM engedélyezettek biztonsági okokból.

---

## Jogosultságok

| Jogosultság        | Leírás               | SDK Funkciók                               |
| ------------------ | -------------------- | ------------------------------------------ |
| `database`         | Adatbázis hozzáférés | `data.set()`, `data.get()`, `data.query()` |
| `notifications`    | Értesítések küldése  | `notifications.send()`                     |
| `remote_functions` | Szerver függvények   | `remote.call()`                            |
| `file_access`      | Fájl hozzáférés      | (később)                                   |
| `user_data`        | Felhasználói adatok  | (később)                                   |

---

## Biztonsági Szabályok

### ❌ TILTOTT

- `eval()` használata
- `Function()` konstruktor
- `innerHTML` használata
- `dangerouslySetInnerHTML`
- `document.write()`
- Külső domain-ekre fetch/XHR
- Dinamikus import külső URL-ről
- Más plugin sémák elérése
- System sémák elérése (platform, auth, public)

### ✅ ENGEDÉLYEZETT

- Svelte komponensek
- Lucide ikonok
- @racona/\* package-ek
- Plugin saját sémája (plugin\_{plugin_id})
- WebOS SDK API-k

---

## Hibakezelés

```typescript
try {
	const result = await window.webOS.remote.call('myFunction');
} catch (error) {
	// Hiba típusok:
	// - PLUGIN_NOT_FOUND
	// - PLUGIN_INACTIVE
	// - PERMISSION_DENIED
	// - REMOTE_CALL_TIMEOUT
	// - NETWORK_ERROR
	// - SERVER_ERROR

	window.webOS.ui.toast('Hiba történt', 'error');
	console.error(error);
}
```

---

## Tesztelés

### Fejlesztői Mód

```bash
bun run dev
```

**Megjegyzés**: Fejlesztői módban mock SDK-t kell használni:

```typescript
// Mock SDK fejlesztéshez
if (!window.webOS) {
	window.webOS = {
		ui: {
			toast: (msg, type) => console.log(`Toast: ${msg}`)
			// ...
		}
		// ...
	};
}
```

### Éles Tesztelés

1. Build: `bun run build`
2. Package: `bun run package`
3. Feltöltés WebOS-be
4. Tesztelés böngészőben

---

## Gyakori Hibák

### 1. "Invalid plugin ID format"

**Probléma**: Plugin ID nem kebab-case formátumú

**Megoldás**: Használj csak kisbetűket, számokat és kötőjelet

```json
"id": "my-plugin"  // ✅ Helyes
"id": "MyPlugin"   // ❌ Hibás
"id": "my_plugin"  // ❌ Hibás
```

### 2. "Permission denied"

**Probléma**: Hiányzó jogosultság a manifest.json-ban

**Megoldás**: Add hozzá a szükséges jogosultságot

```json
"permissions": ["database", "notifications"]
```

### 3. "Module not found"

**Probléma**: Nem futott le a build

**Megoldás**:

```bash
bun run build
```

### 4. "Invalid dependency"

**Probléma**: Nem engedélyezett függőség

**Megoldás**: Csak a fehérlistán lévő package-eket használd

### 5. "Dangerous code pattern detected"

**Probléma**: Tiltott kódminta (eval, innerHTML, stb.)

**Megoldás**: Használj biztonságos alternatívát

---

## Best Practices

### 1. Teljesítmény

- ✅ Cache-eld az adatokat
- ✅ Használj debounce-ot input field-ekhez
- ✅ Lazy load-old a nagy komponenseket
- ❌ Ne hívj API-t minden render-nél

### 2. Biztonság

- ✅ Validáld a user input-ot
- ✅ Használj parameterized query-ket
- ✅ Ne tárolj érzékeny adatokat a kliensen
- ❌ Ne bízz meg a kliens oldali validálásban

### 3. UX

- ✅ Adj visszajelzést minden műveletről (toast)
- ✅ Kezelj le minden hibát
- ✅ Használj loading state-eket
- ✅ Teszteld különböző nyelveken

### 4. Kód Minőség

- ✅ Használj TypeScript-et
- ✅ Kommenteld a kódot
- ✅ Használj értelmes változó neveket
- ✅ Tartsd a komponenseket kicsinek

---

## Példa Projektek

1. **hello-world**: Alapvető SDK funkciók bemutatása
2. **todo-list**: CRUD műveletek, adattárolás (később)
3. **weather**: Remote API hívások (később)
4. **chat**: Real-time, értesítések (később)

---

## További Segítség

- [WebOS SDK API Referencia](../docs/API_REFERENCE.md)
- [Plugin Rendszer Tervezés](../../.kiro/specs/plugin-system/design.md)
- [Példa Pluginok](./hello-world/)

---

## Verziókezelés

Plugin verzió formátum: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: Új funkciók (backward compatible)
- **PATCH**: Bug fix-ek

Példa:

- `1.0.0` → `1.0.1`: Bug fix
- `1.0.1` → `1.1.0`: Új funkció
- `1.1.0` → `2.0.0`: Breaking change

---

Sok sikert a plugin fejlesztéshez! 🚀
