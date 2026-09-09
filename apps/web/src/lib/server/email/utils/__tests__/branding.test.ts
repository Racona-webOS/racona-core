/**
 * Email branding segédfüggvények.
 *
 * A modul a `$lib/env`-ből olvas, ezért az minden esetben mockolva van — a
 * tesztek a környezeti változók és a kimenet közötti leképezést ellenőrzik.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { envMock } = vi.hoisted(() => ({ envMock: {} as Record<string, unknown> }));

vi.mock('$lib/env', () => ({ env: envMock }));

const {
	getBaseUrl,
	getBrandingConfig,
	getAppBrandingHtml,
	getAppBrandingText,
	enrichTemplateDataWithBranding
} = await import('../branding');

/**
 * A mockolt env tartalmának cseréje (a modul ugyanarra az objektumra hivatkozik,
 * ezért helyben ürítjük, nem újat rendelünk hozzá).
 *
 * @param values - A beállítandó környezeti változók.
 */
function setEnv(values: Record<string, unknown>): void {
	for (const key of Object.keys(envMock)) delete envMock[key];
	Object.assign(envMock, values);
}

beforeEach(() => setEnv({}));

describe('getBaseUrl', () => {
	it('az APP_URL-t részesíti előnyben', () => {
		setEnv({ APP_URL: 'https://app.example.com', NODE_ENV: 'development' });
		expect(getBaseUrl('https://kerelem.example.com/oldal')).toBe('https://app.example.com');
	});

	it('APP_URL nélkül a kérés eredetét használja', () => {
		expect(getBaseUrl('https://kerelem.example.com/oldal?a=1')).toBe(
			'https://kerelem.example.com'
		);
	});

	it('URL objektumot is elfogad', () => {
		expect(getBaseUrl(new URL('https://kerelem.example.com/oldal'))).toBe(
			'https://kerelem.example.com'
		);
	});

	it('fejlesztői módban localhost:5173 a tartalék', () => {
		setEnv({ NODE_ENV: 'development' });
		expect(getBaseUrl()).toBe('http://localhost:5173');
	});

	it('végső tartalék a BETTER_AUTH_URL', () => {
		setEnv({ BETTER_AUTH_URL: 'https://auth.example.com' });
		expect(getBaseUrl()).toBe('https://auth.example.com');
	});

	it('ha semmi nincs beállítva, localhost:3000', () => {
		expect(getBaseUrl()).toBe('http://localhost:3000');
	});
});

describe('getBrandingConfig', () => {
	it('üres env esetén az alapértékeket adja', () => {
		const config = getBrandingConfig();

		expect(config.appName).toBe('Racona');
		expect(config.useLogo).toBe(false);
		expect(config.logoMaxWidth).toBe(100);
	});

	it('az EMAIL_LOGO_MAX_WIDTH értékét veszi át', () => {
		setEnv({ EMAIL_LOGO_MAX_WIDTH: '250' });
		expect(getBrandingConfig().logoMaxWidth).toBe(250);
	});

	it.each([
		['üres string', ''],
		['nem szám', 'széles'],
		['nulla', '0'],
		['negatív', '-50'],
		['hiányzó', undefined]
	])('érvénytelen EMAIL_LOGO_MAX_WIDTH (%s) esetén marad a 100', (_cim, value) => {
		setEnv({ EMAIL_LOGO_MAX_WIDTH: value });
		expect(getBrandingConfig().logoMaxWidth).toBe(100);
	});
});

describe('getAppBrandingHtml', () => {
	it('logó nélkül az alkalmazás nevét adja vissza', () => {
		setEnv({ APP_NAME: 'Teszt App' });
		expect(getAppBrandingHtml()).toBe('Teszt App');
	});

	it('useLogo esetén sincs kép, ha nincs logoUrl', () => {
		setEnv({ APP_NAME: 'Teszt App', EMAIL_USE_LOGO: true });
		expect(getAppBrandingHtml()).toBe('Teszt App');
	});

	it('abszolút logó URL-t változatlanul használ', () => {
		setEnv({
			APP_NAME: 'Teszt App',
			EMAIL_USE_LOGO: true,
			APP_LOGO_URL: 'https://cdn.example.com/logo.png'
		});

		expect(getAppBrandingHtml()).toBe(
			'<img src="https://cdn.example.com/logo.png" alt="Teszt App" style="max-width: 100px; height: auto;" />'
		);
	});

	it('relatív logó URL elé a base URL kerül', () => {
		setEnv({
			APP_URL: 'https://app.example.com',
			EMAIL_USE_LOGO: true,
			APP_LOGO_URL: '/logos/logo-small.png'
		});

		expect(getAppBrandingHtml()).toContain('src="https://app.example.com/logos/logo-small.png"');
	});

	it('a logó szélessége az EMAIL_LOGO_MAX_WIDTH-ből jön', () => {
		setEnv({
			EMAIL_USE_LOGO: true,
			APP_LOGO_URL: 'https://cdn.example.com/logo.png',
			EMAIL_LOGO_MAX_WIDTH: '180'
		});

		expect(getAppBrandingHtml()).toContain('max-width: 180px;');
	});

	it('a hívó felülbírálhatja a konfigurációt', () => {
		setEnv({ EMAIL_USE_LOGO: true, APP_LOGO_URL: 'https://cdn.example.com/logo.png' });
		expect(getAppBrandingHtml({ useLogo: false, appName: 'Felülírt' })).toBe('Felülírt');
	});
});

describe('getAppBrandingText', () => {
	it('logó bekapcsolva is a nevet adja vissza', () => {
		setEnv({
			APP_NAME: 'Teszt App',
			EMAIL_USE_LOGO: true,
			APP_LOGO_URL: 'https://cdn.example.com/logo.png'
		});

		expect(getAppBrandingText()).toBe('Teszt App');
	});
});

describe('enrichTemplateDataWithBranding', () => {
	it('megtartja az eredeti mezőket és branding mezőkkel egészíti ki', () => {
		setEnv({ APP_NAME: 'Teszt App', APP_URL: 'https://app.example.com' });

		const result = enrichTemplateDataWithBranding({ userName: 'Anna' });

		expect(result.userName).toBe('Anna');
		expect(result.appName).toBe('Teszt App');
		expect(result.appUrl).toBe('https://app.example.com');
		expect(result.appBrandingText).toBe('Teszt App');
	});

	it('az appName szöveg marad, az appNameHtml viszont logó lehet', () => {
		setEnv({
			APP_NAME: 'Teszt App',
			APP_URL: 'https://app.example.com',
			EMAIL_USE_LOGO: true,
			APP_LOGO_URL: '/logo.png'
		});

		const result = enrichTemplateDataWithBranding({});

		expect(result.appName).toBe('Teszt App');
		expect(result.appNameHtml).toContain('<img');
		expect(result.appBrandingHtml).toBe(result.appNameHtml);
	});
});
