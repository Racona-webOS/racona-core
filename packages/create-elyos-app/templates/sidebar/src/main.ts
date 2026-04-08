/**
 * Standalone dev entry point.
 * Vite dev szerveren fut (bun dev), az App.svelte-t közvetlenül mountolja.
 */
import { mount } from 'svelte';
import App from './App.svelte';

async function initDevSDK() {
	if (typeof window !== 'undefined' && !window.webOS) {
		const { MockWebOSSDK } = await import('@elyos-dev/sdk/dev');

		// Locale fájlok betöltése és átadása a MockSDK-nak
		const localeModules = import.meta.glob<Record<string, string>>('../../locales/*.json', {
			eager: true,
			import: 'default'
		});

		const translations: Record<string, Record<string, string>> = {};
		for (const [path, data] of Object.entries(localeModules)) {
			const locale = path.replace('../../locales/', '').replace('.json', '');
			translations[locale] = data;
		}

		const defaultLocale = 'hu' in translations ? 'hu' : (Object.keys(translations)[0] ?? 'en');

		MockWebOSSDK.initialize({
			i18n: { locale: defaultLocale, translations }
		});
	}
}

async function init() {
	await initDevSDK();
	const target = document.getElementById('app');
	if (target) mount(App, { target });
}

init();
