<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../appAdmin.css';
	import './protected.css';
	import Desktop from '$lib/components/core/Desktop.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { browser } from '$app/environment';
	import { setContext, onMount, onDestroy, untrack } from 'svelte';
	import { createThemeManager } from '$lib/stores';
	import { loadPermissions } from '$lib/stores';
	import { setDevMode } from '$lib/stores';
	import { updateSettings } from '$apps/settings/settings.remote';
	import { getI18nService } from '$lib/i18n';
	import { I18nProvider } from '$lib/i18n/components';
	import { getSupportedLocales } from '$lib/i18n/config';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { getChatStore } from '$apps/chat/stores/chatStore.svelte';
	import PluginDialog from '$lib/components/core/PluginDialog.svelte';
	import { setGlobalDialogHandler } from '$lib/stores/windowStore.svelte';
	import type { DialogOptions, DialogResult } from '@elyos/sdk';
	// @ts-ignore - no type declarations available
	import '@fontsource-variable/quicksand';

	// PluginDialog referencia a dialog handler regisztrálásához
	let pluginDialog: { showDialog: (options: DialogOptions) => Promise<DialogResult> } | undefined =
		$state();

	let { children, data } = $props();

	// Settings state - reaktív állapot a data.settings alapján
	// $derived.by-t használunk, hogy csak valódi értékváltozáskor frissüljön
	const settings = $derived(data.settings);

	// Settings kontextus beállítása - stabil referencia, getter-ekkel reaktív
	// A setContext egyszer fut le, a getter-ek mindig a legfrissebb értéket adják vissza
	const settingsContext = {
		get windowPreview() {
			return settings.windowPreview;
		},
		get screenshotThumbnailHeight() {
			return settings.screenshotThumbnailHeight;
		},
		get preferPerformance() {
			return settings.preferPerformance;
		},
		get background() {
			return settings.background;
		},
		get taskbar() {
			return settings.taskbar;
		},
		get startMenu() {
			return settings.startMenu;
		},
		get desktop() {
			return settings.desktop;
		},
		get theme() {
			return settings.theme;
		},
		get locale() {
			return data.locale;
		},
		get userId() {
			return data.user?.id;
		}
	};
	setContext('settings', settingsContext);

	let themeManager: ReturnType<typeof createThemeManager> | undefined;

	// Locale beállítása AZONNAL (nem onMount-ban), hogy az I18nProvider a helyes locale-lal töltse be
	// Ez csak egyszer kell lefusson inicializáláskor, nem minden data változásra
	if (browser) {
		const i18nService = getI18nService();
		const store = getTranslationStore();

		// Támogatott nyelvek beállítása a szerverről jövő konfigurációval
		// eslint-disable-next-line svelte/valid-compile -- initial setup, not reactive
		const supportedLocales = getSupportedLocales(
			Array.isArray(data.supportedLocales) ? data.supportedLocales : [data.supportedLocales]
		);
		store.setSupportedLocales(supportedLocales);

		// eslint-disable-next-line svelte/valid-compile -- initial setup, not reactive
		const currentLocale = i18nService.getLocale();
		if (data.locale && data.locale !== currentLocale) {
			i18nService.setLocale(data.locale);
		}

		// Dev mode beállítása a szerver layout adatai alapján
		setDevMode(data.devMode ?? false);
	}

	// ThemeManager inicializálása mount-kor
	onMount(async () => {
		themeManager = createThemeManager(settings.theme);

		// Dialog handler regisztrálása az SDK-hoz
		if (pluginDialog) {
			setGlobalDialogHandler((options) => pluginDialog!.showDialog(options));
		}

		// Jogosultságok betöltése
		await loadPermissions();

		// Beállítjuk a mentési callback-et
		themeManager.setSaveCallback(async (themeSettings) => {
			await updateSettings({ theme: themeSettings });
		});

		// Initialize notification store
		if (data.user?.id) {
			const notificationStore = getNotificationStore();
			notificationStore.connect(parseInt(data.user.id));

			// Initialize chat store
			const chatStore = getChatStore();
			chatStore.connect(parseInt(data.user.id));
		}
	});

	// Cleanup notification store on unmount
	onDestroy(() => {
		if (browser) {
			const notificationStore = getNotificationStore();
			notificationStore.disconnect();

			// Cleanup chat store
			const chatStore = getChatStore();
			chatStore.disconnect();
		}
	});

	// ThemeManager settings frissítése amikor a szerver settings változik
	$effect(() => {
		const currentSettings = settings.theme;

		untrack(() => {
			if (
				themeManager &&
				JSON.stringify(themeManager.settings) !== JSON.stringify(currentSettings)
			) {
				themeManager.settings = { ...currentSettings };
			}
		});
	});

	// Update browser tab title with unread notification count
	$effect(() => {
		if (!browser) return;

		const notificationStore = getNotificationStore();
		const unreadCount = notificationStore.unreadCount;
		const baseTitle = data.appName;

		if (unreadCount > 0) {
			document.title = `(${unreadCount}) ${baseTitle}`;
		} else {
			document.title = baseTitle;
		}
	});
</script>

{#if browser}
	<Toaster richColors position="top-right" expand={true} closeButton />
	<PluginDialog bind:this={pluginDialog} />
{/if}
<I18nProvider namespaces={['desktop', 'notifications']}>
	<Desktop>
		{@render children()}
	</Desktop>
</I18nProvider>

<style>
	:global(h1, h2, h3, h4, h5, h6, lablel) {
		font-family: 'Quicksand Variable', serif;
	}
</style>
