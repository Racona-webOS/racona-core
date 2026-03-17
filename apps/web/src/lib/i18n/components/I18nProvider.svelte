<script lang="ts">
	/**
	 * I18nProvider - Namespace betöltő wrapper komponens
	 *
	 * Automatikusan betölti a megadott namespace-eket és
	 * loading/error állapotot kezel.
	 *
	 * @example
	 * <I18nProvider namespaces={['settings', 'common']}>
	 *   <SettingsContent />
	 * </I18nProvider>
	 *
	 * @example
	 * <!-- Egyedi loading/error snippetekkel -->
	 * <I18nProvider namespaces={['settings']}>
	 *   <SettingsContent />
	 *   {#snippet loading()}
	 *     <MyCustomLoader />
	 *   {/snippet}
	 *   {#snippet error(msg)}
	 *     <MyCustomError message={msg} />
	 *   {/snippet}
	 * </I18nProvider>
	 */

	import type { Snippet } from 'svelte';
	import { setContext, onMount } from 'svelte';
	import { getI18nService } from '../service.js';
	import { getTranslationStore } from '../store.svelte.js';
	import type { TranslationParams } from '../types.js';

	const I18N_CONTEXT_KEY = Symbol('i18n');

	interface I18nContext {
		t: (key: string, params?: TranslationParams) => string;
		tc: (key: string, count: number, params?: TranslationParams) => string;
		locale: string;
	}

	interface Props {
		/** Betöltendő namespace-ek listája */
		namespaces: string[];
		/** Gyermek tartalom */
		children: Snippet;
		/** Egyedi loading snippet */
		loading?: Snippet;
		/** Egyedi error snippet - megkapja a hibaüzenetet */
		error?: Snippet<[string]>;
	}

	let { namespaces, children, loading, error }: Props = $props();

	const i18nService = getI18nService();
	const store = getTranslationStore();

	// Ellenőrizzük, hogy minden namespace be van-e töltve
	let allLoaded = $derived(namespaces.every((ns) => store.loadedNamespaces.has(ns)));
	let hasError = $derived(store.error !== null);
	let errorMessage = $derived(store.error ?? '');
	// Egyszer már betöltöttük-e (locale váltáskor ne unmountolja a gyerekeket)
	let everLoaded = $state(false);
	$effect(() => {
		if (allLoaded) everLoaded = true;
	});

	// Context létrehozása a gyermek komponensek számára
	const context: I18nContext = {
		get t() {
			return (key: string, params?: TranslationParams) => i18nService.t(key, params);
		},
		get tc() {
			return (key: string, count: number, params?: TranslationParams) =>
				i18nService.tc(key, count, params);
		},
		get locale() {
			return store.currentLocale;
		}
	};

	setContext(I18N_CONTEXT_KEY, context);

	// Namespace-ek betöltése mount-kor
	onMount(async () => {
		const loadPromises = namespaces
			.filter((ns) => !store.loadedNamespaces.has(ns))
			.map((ns) => i18nService.loadNamespace(ns));

		if (loadPromises.length > 0) {
			await Promise.all(loadPromises);
		}
	});

	// Export a context key for useI18n
	export { I18N_CONTEXT_KEY };
</script>

{#if hasError && error && !everLoaded}
	{@render error(errorMessage)}
{:else if hasError && !everLoaded}
	<p class="i18n-error">Hiba a fordítások betöltésekor: {errorMessage}</p>
{:else if !allLoaded && !everLoaded && loading}
	{@render loading()}
{:else if !allLoaded && !everLoaded}
	<!--<p class="i18n-loading">Betöltés...</p>-->
{:else}
	{@render children()}
{/if}

<style>
	/*.i18n-loading {
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}*/

	.i18n-error {
		color: var(--color-red-500);
		font-size: 0.875rem;
	}
</style>
