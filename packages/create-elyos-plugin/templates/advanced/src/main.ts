/**
 * Plugin entry point
 *
 * Standalone módban a Mock SDK-t használja,
 * ElyOS módban a runtime SDK-t kapja.
 */
import { mount } from 'svelte';
import App from './App.svelte';

// Standalone fejlesztéshez: Mock SDK inicializálás
async function initDevSDK() {
	if (typeof window !== 'undefined' && !window.webOS) {
		const { MockWebOSSDK } = await import('@elyos/sdk/dev');
		MockWebOSSDK.initialize({
			i18n: {
				locale: 'en',
				translations: {
					en: { title: 'My Plugin', welcome: 'Welcome!' },
					hu: { title: 'Plugin', welcome: 'Üdvözöljük!' }
				}
			}
		});
	}
}

async function init() {
	await initDevSDK();

	const target = document.getElementById('app');
	if (target) {
		mount(App, { target });
	}
}

init();

export default App;
