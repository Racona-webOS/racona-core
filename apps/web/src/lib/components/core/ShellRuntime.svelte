<!--
 A felület közös indítása, keretfüggetlenül (asztali és mobil keret is ebbe ágyazódik).
 Létrehozza és kontextusba teszi az ablakkezelőt, az asztal és az AI asszisztens tárolóját,
 betölti a pluginok közös könyvtárait, elindítja a kapcsolatfigyelőt, és a témát
 a dokumentum gyökerére alkalmazza.
 -->
<script lang="ts">
	import { getContext, onMount, untrack, type Snippet } from 'svelte';
	import {
		createWindowManager,
		setWindowManager,
		getThemeManager,
		createDesktopStore,
		setDesktopStore,
		getConnectionStore
	} from '$lib/stores';
	import {
		createAiAssistantStore,
		setAiAssistantStore
	} from '$apps/ai-assistant/stores/aiAssistantStore.svelte';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { initializeSharedLibraries } from '$lib/sdk/shared-libraries';
	import { getShellInfo } from '$lib/stores/shellMode';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import { parseDeepLink, stripDeepLink, openDeepLink } from '$lib/services/client/deepLink';
	import { useI18n } from '$lib/i18n/hooks';

	let { children }: { children: Snippet } = $props();

	const { t } = useI18n();

	const settings = getContext<{ userId?: string }>('settings');
	const shell = getShellInfo();

	const windowManager = createWindowManager();
	setWindowManager(windowManager);
	windowManager.setPersistence(shell.mode === 'desktop');

	// A pluginok az SDK-n át olvassák (sdk.context.shell)
	if (browser) {
		(window as unknown as Record<string, unknown>).__RACONA_SHELL__ = shell.mode;
	}

	const desktopStore = createDesktopStore();
	setDesktopStore(desktopStore);

	// AI Assistant store inicializálása a Svelte context-ben
	const aiAssistantStore = createAiAssistantStore();
	setAiAssistantStore(aiAssistantStore);

	// User ID beállítása a store-ban (multi-user support)
	if (settings.userId) {
		aiAssistantStore.setUserId(settings.userId);
	}

	// ThemeManager csak kliens oldalon
	let themeManager = $state<ReturnType<typeof getThemeManager> | null>(null);
	let isInitialized = $state(false);

	$effect(() => {
		if (browser && !isInitialized) {
			isInitialized = true;

			// Initialize shared libraries for plugins (async — Svelte runtime
			// modulokat dinamikusan tölti, hogy az SSR ne értelmezze)
			initializeSharedLibraries().catch((err) => {
				console.error('[ShellRuntime] Shared libraries init failed:', err);
			});

			themeManager = getThemeManager();

			// Szerver kapcsolat figyelő indítása
			const connectionStore = getConnectionStore();
			connectionStore.start();

			// Hallgatjuk a TTS Provider konfiguráció változásait
			window.addEventListener('tts-provider-config-changed', handleTTSConfigChange);
		}
	});

	onMount(() => {
		// TTS Provider globális státusz ellenőrzése
		untrack(() => checkTTSProviderStatus());

		return () => {
			window.removeEventListener('tts-provider-config-changed', handleTTSConfigChange);
		};
	});

	async function checkTTSProviderStatus() {
		try {
			const { isTTSProviderEnabled, getAIAssistantConfig } =
				await import('$apps/settings/admin-config.remote');
			const status = await isTTSProviderEnabled({});
			aiAssistantStore.tts.setGloballyEnabled(status.enabled);

			// Admin TTS config betöltése
			if (status.enabled && status.configured) {
				const configResult = await getAIAssistantConfig({});
				if (configResult.success && configResult.config) {
					aiAssistantStore.tts.loadAdminConfig(configResult.config.ttsProvider);
				}
			}

			// User TTS settings betöltése
			const { getTTSSettings } = await import('$apps/ai-assistant/tts-settings.remote');
			const userSettingsResult = await getTTSSettings({});
			if (userSettingsResult.success && userSettingsResult.settings) {
				aiAssistantStore.tts.loadUserSettings(userSettingsResult.settings);
			}
		} catch (error) {
			console.error('[ShellRuntime] Error checking TTS Provider status:', error);
		}
	}

	function handleTTSConfigChange() {
		setTimeout(() => {
			checkTTSProviderStatus();
		}, 100);
	}

	// Közvetlen link (/admin?app=…&entry=…). A komponens a fordítások betöltése után jön
	// létre, ezért nem az első navigáció eseményére várunk; a setTimeout miatt a
	// SvelteKit router már kész, amikor a címet átírjuk.
	onMount(() => {
		const timer = setTimeout(openDeepLinkFromUrl, 0);
		return () => clearTimeout(timer);
	});

	async function openDeepLinkFromUrl() {
		const link = parseDeepLink(page.url);
		if (!link) return;

		// A paramétereket eltávolítjuk, hogy újratöltéskor ne nyíljon meg újra
		replaceState(stripDeepLink(page.url), page.state);

		try {
			const app = await getAppByName(link.app);
			// Olyan app, amelyhez a felhasználónak nincs hozzáférése, nem nyílik meg
			if (!app) return;
			if (!openDeepLink(windowManager, app, link, shell.mode)) {
				toast.info(t('desktop.mobile.notifications.desktopOnly'));
			}
		} catch (error) {
			console.error('[ShellRuntime] Deep link failed:', error);
		}
	}

	// CSS változók és osztályok alkalmazása a document root-ra (html elem)
	$effect(() => {
		if (themeManager) {
			// CSS változók beállítása
			const vars = themeManager.cssVariables;
			Object.entries(vars).forEach(([key, value]) => {
				document.documentElement.style.setProperty(key, value);
			});

			// CSS osztályok szinkronizálása (dark/light mód, stb.)
			document.documentElement.className = themeManager.cssClasses;
		}
	});
</script>

{@render children()}
