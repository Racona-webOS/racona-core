<script lang="ts">
	import { getWindowId } from '$lib/services/client/appContext';
	import { getWindowManager } from '$lib/stores';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import HelpLayout from './components/HelpLayout.svelte';
	import { resolveHelpLocale } from './utils/helpContent';
	import { getPluginHelpVersion, refreshPluginHelp } from './utils/pluginHelp.svelte';

	const translationStore = getTranslationStore();
	const windowManager = getWindowManager();
	const windowId = getWindowId();

	// Az ablak eredeti címe ("Súgó"), a megnyitott oldal címe ehhez fűződik
	const baseTitle = windowManager.windows.find((w) => w.id === windowId)?.title ?? '';

	const locale = $derived(resolveHelpLocale(translationStore.currentLocale));

	// A pluginek súgója megnyitáskor frissül, hogy az újonnan telepítettek is látszódjanak
	const pluginHelpReady = refreshPluginHelp();
</script>

{#await pluginHelpReady then}
	<!-- A menü a súgó nyelvén és a pluginek súgójából épül, változáskor újraépítjük -->
	{#key `${locale}:${getPluginHelpVersion()}`}
		<HelpLayout {locale} {baseTitle} />
	{/key}
{/await}
