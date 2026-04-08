import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	onwarn(warning, handler) {
		// Dev módban a customElement: true nincs bekapcsolva (csak build-kor),
		// ezért ez a warning várható és nem jelent hibát.
		if (warning.code === 'options_missing_custom_element') return;
		handler(warning);
	}
};
