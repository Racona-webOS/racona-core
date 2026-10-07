<script lang="ts">
	import { getWindowId } from '$lib/services/client/appContext';
	import { getWindowManager } from '$lib/stores';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import HelpLayout from './components/HelpLayout.svelte';
	import { resolveHelpLocale } from './utils/helpContent';

	const translationStore = getTranslationStore();
	const windowManager = getWindowManager();
	const windowId = getWindowId();

	// Az ablak eredeti címe ("Súgó"), a megnyitott oldal címe ehhez fűződik
	const baseTitle = windowManager.windows.find((w) => w.id === windowId)?.title ?? '';

	const locale = $derived(resolveHelpLocale(translationStore.currentLocale));
</script>

<!-- A menü címei a súgó nyelvén vannak, nyelvváltáskor újraépítjük -->
{#key locale}
	<HelpLayout {locale} {baseTitle} />
{/key}
