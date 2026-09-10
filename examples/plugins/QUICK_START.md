# 🚀 Gyors Kezdés - WebOS Plugin Fejlesztés

## Előfeltételek

- **Bun** telepítve (https://bun.sh)
- **WebOS** futtatva (http://localhost:5173)

## 5 Lépésben Plugin Fejlesztés

### 1️⃣ Hello World Kipróbálása

```bash
# Lépj be a hello-world könyvtárba
cd examples/plugins/hello-world

# Telepítsd a függőségeket
bun install

# Build
bun run build

# Csomag készítése
bun run package
```

✅ Létrejött a `hello-world.wospkg` fájl!

### 2️⃣ Plugin Feltöltése

**Böngészőben:**

1. Nyisd meg: http://localhost:5173
2. Settings → Plugins
3. Upload Plugin → Válaszd ki a `hello-world.wospkg` fájlt

**Vagy API-n keresztül:**

```bash
curl -X POST http://localhost:5173/api/plugins/upload \
  -F "file=@hello-world.wospkg"
```

### 3️⃣ Saját Plugin Készítése

```bash
# Másold le a hello-world példát
cp -r examples/plugins/hello-world examples/plugins/my-plugin

# Lépj be
cd examples/plugins/my-plugin

# Módosítsd a manifest.json-t
# - id: "my-plugin"
# - name: "My Plugin"
# - description: "..."

# Telepítsd a függőségeket
bun install
```

### 4️⃣ Fejlesztés

```bash
# Fejlesztői mód (hot-reload)
bun run dev

# Szerkeszd a src/App.svelte fájlt
# Szerkeszd a server/functions.js fájlt
# Szerkeszd a locales/*.json fájlokat
```

### 5️⃣ Build és Feltöltés

```bash
# Build
bun run build

# Package
bun run package

# Feltöltés
curl -X POST http://localhost:5173/api/plugins/upload \
  -F "file=@my-plugin.wospkg"
```

## 📝 Minimális Plugin Struktúra

```
my-plugin/
├── manifest.json          # ⚠️ KÖTELEZŐ
├── package.json
├── vite.config.js
├── build-package.js
└── src/
    └── App.svelte         # ⚠️ KÖTELEZŐ
```

## 🎯 WebOS SDK Gyors Referencia

```typescript
// Toast
window.webOS.ui.toast('Hello!', 'success');

// Remote call
const result = await window.webOS.remote.call('myFunction', { param: 'value' });

// Data storage
await window.webOS.data.set('key', 'value');
const value = await window.webOS.data.get('key');

// I18n
const text = window.webOS.i18n.t('welcome');

// Notification
await window.webOS.notifications.send({
	userId: window.webOS.context.user.id, // más felhasználónak csak notifications.send joggal
	title: 'Hello',
	message: 'World'
});

// Context
window.webOS.context.window.close();
window.webOS.context.window.setTitle('New Title');

// Assets
const iconUrl = window.webOS.assets.getUrl('icon.svg');
```

## 🔑 Manifest Példa

```json
{
	"id": "my-plugin",
	"name": "My Plugin",
	"version": "1.0.0",
	"description": "My awesome plugin",
	"author": "Your Name <your@email.com>",
	"entry": "dist/index.js",
	"icon": "assets/icon.svg",
	"permissions": ["database", "notifications", "remote_functions"],
	"dependencies": {
		"svelte": "^5.0.0",
		"lucide-svelte": "^0.263.1"
	},
	"minWebOSVersion": "2.0.0",
	"locales": ["hu", "en"]
}
```

## 🐛 Gyakori Hibák

| Hiba                 | Megoldás                                      |
| -------------------- | --------------------------------------------- |
| "Invalid plugin ID"  | Használj kebab-case-t: `my-plugin`            |
| "Permission denied"  | Add hozzá a jogosultságot a manifest.json-ban |
| "Module not found"   | Futtasd le: `bun run build`                   |
| "Invalid dependency" | Csak fehérlistás package-eket használj        |

## 📚 További Dokumentáció

- [Plugin Fejlesztői Útmutató](./PLUGIN_DEVELOPMENT_GUIDE.md) - Teljes útmutató
- [Hello World README](./hello-world/README.md) - Részletes példa
- [WebOS SDK API](../docs/API_REFERENCE.md) - API referencia

## 💡 Tippek

1. ✅ Kezdd a Hello World módosításával
2. ✅ Használj TypeScript-et
3. ✅ Tesztelj gyakran (build + upload)
4. ✅ Kezelj le minden hibát (try-catch)
5. ✅ Dokumentáld a kódot

---

**Kérdésed van?** Nézd meg a [Plugin Fejlesztői Útmutatót](./PLUGIN_DEVELOPMENT_GUIDE.md)!

Sok sikert! 🚀
