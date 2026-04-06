/**
 * Standalone dev entry point.
 * Vite dev szerveren fut (bun dev), az App.svelte-t közvetlenül mountolja.
 */
import { mount } from 'svelte';
import App from './App.svelte';

async function initDevSDK() {
	if (typeof window !== 'undefined' && !window.webOS) {
		const { MockWebOSSDK } = await import('@elyos/sdk/dev');
		MockWebOSSDK.initialize();
	}
}

async function init() {
	await initDevSDK();
	const target = document.getElementById('app');
	if (target) mount(App, { target });
}

init();
