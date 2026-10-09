# Email Branding Utilities

Ez a modul lehetővé teszi az alkalmazás branding információinak dinamikus kezelését az email template-ekben.

## Környezeti változók

```bash
# Alkalmazás neve (alapértelmezett: "Racona")
APP_NAME=Racona

# Alkalmazás URL-je (opcionális - automatikusan detektálódik)
# Ha nincs megadva, a rendszer automatikusan használja a request URL-t
APP_URL=https://yourdomain.com

# Logo URL (lehet abszolút vagy relatív)
APP_LOGO_URL=/logo-small.png
# vagy
APP_LOGO_URL=https://yourdomain.com/logo-small.png

# Logo használata emailekben (alapértelmezett: false)
EMAIL_USE_LOGO=true
```

## Automatikus URL detektálás

Az `APP_URL` környezeti változó **opcionális**. Ha nincs beállítva:

1. **Request URL-ből**: Ha a `requestUrl` paraméter át van adva, abból generálódik
2. **Development módban**: `http://localhost:5173`
3. **Fallback**: `http://localhost:3000`

### Használat request URL-lel

```typescript
// SvelteKit route-ban vagy server action-ben
await emailManager.sendTemplatedEmail({
	to: 'user@example.com',
	template: EmailTemplateType.WELCOME,
	data: { name: 'John' },
	requestUrl: event.url.href // vagy event.url.origin
});
```

## Használat

### Automatikus branding hozzáadás

Az `EmailManager.sendTemplatedEmail()` automatikusan hozzáadja a következő mezőket minden template adathoz:

- `appName`: Az alkalmazás neve (szöveg)
- `appUrl`: Az alkalmazás URL-je (dinamikusan detektálva)
- `appBrandingHtml`: HTML verzió (logo vagy szöveg)
- `appBrandingText`: Plain text verzió (mindig szöveg)

### Email template-ekben

#### HTML template-ben

```html
<!-- Logo vagy szöveg használata (környezeti változótól függ) -->
<p>Üdvözöljük a {{appBrandingHtml}} alkalmazásban!</p>

<!-- Mindig csak szöveg -->
<p>Üdvözöljük a {{appName}} alkalmazásban!</p>

<!-- Link az alkalmazáshoz -->
<a href="{{appUrl}}">Látogasson el weboldalunkra</a>
```

#### Text template-ben

```text
Üdvözöljük a {{appBrandingText}} alkalmazásban!
Látogasson el: {{appUrl}}
```

### Példa kimenet

**EMAIL_USE_LOGO=false esetén:**

```html
<p>Üdvözöljük a Racona alkalmazásban!</p>
```

**EMAIL_USE_LOGO=true esetén:**

```html
<p>
	Üdvözöljük a
	<img
		src="https://yourdomain.com/logo-small.png"
		alt="Racona"
		style="max-width: 150px; height: auto;"
	/>
	alkalmazásban!
</p>
```

## Manuális használat

Ha közvetlenül szeretnéd használni a branding funkciókat:

```typescript
import {
	getBrandingConfig,
	getAppBrandingHtml,
	getAppBrandingText,
	enrichTemplateDataWithBranding,
	getBaseUrl
} from '$lib/server/email/utils/branding';

// Konfiguráció lekérése (opcionális request URL-lel)
const config = getBrandingConfig(event.url.href);

// Base URL lekérése
const baseUrl = getBaseUrl(event.url.href);

// HTML generálás
const html = getAppBrandingHtml();

// Plain text generálás
const text = getAppBrandingText();

// Template adat gazdagítása
const enrichedData = enrichTemplateDataWithBranding(
	{
		name: 'John',
		email: 'john@example.com'
	},
	event.url.href // opcionális
);
// Eredmény: {
//   name: 'John',
//   email: '...',
//   appName: 'Racona',
//   appUrl: 'https://yourdomain.com',
//   appBrandingHtml: '...',
//   appBrandingText: '...'
// }
```

## Logo követelmények

- **Formátum**: PNG, JPG, SVG
- **Méret**: Ajánlott max. 150px szélesség
- **Elhelyezés**: `apps/web/static/` mappában (pl. `logo-small.png`)
- **URL**: Relatív (`/logo-small.png`) vagy abszolút (`https://...`)

## Megjegyzések

- A `appBrandingHtml` mező automatikusan `<img>` taget generál, ha logo van beállítva
- A `appBrandingText` mindig csak szöveget ad vissza (email kliens kompatibilitás miatt)
- Az `appName` mező mindig elérhető, függetlenül a logo beállítástól
- A logo URL automatikusan kiegészül az `APP_URL`-lel, ha relatív útvonal
- Az `APP_URL` opcionális - ha nincs beállítva, automatikusan detektálódik a request-ből
