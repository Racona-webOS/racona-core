<script lang="ts">
	import { getContext } from 'svelte';
	import {
		createWindowManager,
		setWindowManager,
		getThemeManager,
		createDesktopStore,
		setDesktopStore,
		getConnectionStore
	} from '$lib/stores';
	import { getAppByName, getApps } from '$lib/services/client/appRegistry';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import Window from '$lib/components/core/window/Window.svelte';
	import Taskbar from '$lib/components/core/Taskbar.svelte';
	import CriticalNotificationDialog from '$lib/components/core/CriticalNotificationDialog.svelte';
	import DesktopShortcut from '$lib/components/core/DesktopShortcut.svelte';
	import type { BackgroundType } from '$lib/types/desktopEnviroment.ts';
	import { browser } from '$app/environment';
	import { useI18n } from '$lib/i18n/hooks';
	import { initializeSharedLibraries } from '$lib/sdk/shared-libraries';

	const { t } = useI18n();

	const settings = getContext<{
		background: {
			type: BackgroundType;
			value: string;
			scope?: 'shared' | 'user';
			blur?: number;
			grayscale?: boolean;
		};
		theme: {
			mode: 'light' | 'dark' | 'auto';
			modeTaskbarStartMenu: 'light' | 'dark' | 'auto';
			colorPrimaryHue: string;
			fontSize: 'small' | 'medium' | 'large';
		};
		userId?: string;
	}>('settings');

	const windowManager = createWindowManager();
	setWindowManager(windowManager);

	const desktopStore = createDesktopStore();
	setDesktopStore(desktopStore);

	// ThemeManager csak kliens oldalon
	let themeManager = $state<ReturnType<typeof getThemeManager> | null>(null);
	let apps = $state<Awaited<ReturnType<typeof getApps>>>([]);
	let isInitialized = $state(false);

	// Load shortcuts and apps on mount (only once)
	$effect(() => {
		if (browser && !isInitialized) {
			isInitialized = true;

			// Initialize shared libraries for plugins
			initializeSharedLibraries();

			themeManager = getThemeManager();
			desktopStore.loadShortcuts();
			getApps()
				.then((result) => {
					apps = result;
				})
				.catch((err) => {
					console.error('[Desktop] Failed to load apps:', err);
				});

			// Szerver kapcsolat figyelő indítása
			const connectionStore = getConnectionStore();
			connectionStore.start();
		}
	});

	// Handle window resize - reflow icons if needed
	$effect(() => {
		if (!browser) return;

		const handleResize = () => {
			const workspace = document.getElementById('workspace');
			if (!workspace) return;

			const rect = workspace.getBoundingClientRect();
			desktopStore.reflowIcons(rect.width, rect.height);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	let { children } = $props();

	// Háttérkép URL generálása scope alapján
	function getBackgroundImageUrl(): string {
		if (!settings.background.value) return '';
		const scope = settings.background.scope || 'shared';
		if (scope === 'user' && settings.userId) {
			return `/api/files/backgrounds/user-${settings.userId}/${settings.background.value}`;
		}
		return `/api/files/backgrounds/shared/image/${settings.background.value}`;
	}

	function handleWorkspaceClick(e: MouseEvent) {
		// Ha a workspace-re kattintunk (nem ablakra), deaktiváljuk az összes ablakot
		if (e.target === e.currentTarget) {
			windowManager.deactivateAllWindows();
			desktopStore.selectShortcut(null);
		}
	}

	function handleWorkspaceKeydown(e: KeyboardEvent) {
		// Ne akadályozzuk meg a billentyűleütést input mezőkben, textarea-ban vagy contenteditable elemekben
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// Enter vagy Space billentyűre ugyanaz történik, mint kattintásra
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			windowManager.deactivateAllWindows();
		}
	}

	async function handleWorkspaceDrop(e: DragEvent) {
		e.preventDefault();

		const appId = e.dataTransfer?.getData('application/x-elyos-app');
		if (!appId) return;

		// Check if shortcut already exists for this app
		const existingShortcut = desktopStore.shortcuts.find((s) => s.appId === appId);
		if (existingShortcut) {
			// Don't create duplicate, just return
			console.log('[Desktop] Shortcut already exists for app:', appId);
			return;
		}

		console.log('[Desktop] Creating new shortcut for app:', appId);

		const workspace = document.getElementById('workspace');
		if (!workspace) return;

		const rect = workspace.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Snap to grid
		const position = desktopStore.snapToGrid({ x, y });

		// Check if position is occupied
		if (desktopStore.isPositionOccupied(position)) {
			// Find next available position
			const availablePosition = desktopStore.findNextAvailablePosition(rect.width, rect.height);
			await desktopStore.createShortcut(appId, availablePosition);
		} else {
			await desktopStore.createShortcut(appId, position);
		}
	}

	function handleWorkspaceDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}

	async function handleArrangeIcons() {
		await desktopStore.arrangeIcons(apps);
	}

	function handleToggleIcons() {
		desktopStore.toggleIconsVisibility();
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

	// SSR-hez: effektív téma mód kiszámítása settings-ből
	function getEffectiveMode() {
		if (settings.theme.mode === 'auto') {
			return 'dark'; // SSR fallback
		}
		return settings.theme.mode;
	}

	// CSS osztályok SSR-hez és kliens oldalhoz
	const cssClasses = $derived(
		themeManager ? themeManager.cssClasses : `${getEffectiveMode()} font-${settings.theme.fontSize}`
	);

	// Háttérkép filterek: blur és/vagy grayscale
	const hasImageFilters = $derived(
		(settings.background.blur && settings.background.blur > 0) || settings.background.grayscale
	);

	const imageFilterStyle = $derived(() => {
		const filters: string[] = [];
		if (settings.background.blur && settings.background.blur > 0) {
			filters.push(`blur(${settings.background.blur}px)`);
		}
		if (settings.background.grayscale) {
			filters.push('grayscale(100%)');
		}
		return filters.join(' ');
	});
</script>

<div
	class={['desktop select-none', cssClasses]}
	style:background-color={settings.background.type === 'color' &&
	settings.background.value &&
	settings.background.value.length > 0
		? settings.background.value
		: ''}
	style:background={settings.background.type === 'image' &&
	settings.background.value &&
	settings.background.value.length > 0 &&
	!hasImageFilters
		? `url(${getBackgroundImageUrl()}) center center / cover no-repeat fixed`
		: ''}
	style:--primary-h={settings.theme.colorPrimaryHue}
>
	{#if settings.background.type === 'image' && settings.background.value && settings.background.value.length > 0 && hasImageFilters}
		<div
			class="image-background"
			class:has-blur={settings.background.blur && settings.background.blur > 0}
			style:background-image="url({getBackgroundImageUrl()})"
			style:filter={imageFilterStyle()}
		></div>
	{/if}
	{#if browser && settings.background.type === 'video' && settings.background.value && settings.background.value.length > 0}
		<div class="video-background">
			{#key settings.background.value}
				<video autoplay muted loop playsinline>
					<source
						src={`/api/files/backgrounds/shared/video/${settings.background.value}`}
						type="video/mp4"
					/>
					{t('desktop.videoBackground.notSupported')}
				</video>
			{/key}
		</div>
	{/if}
	<ContextMenu.Root>
		<ContextMenu.Trigger class="workspace-trigger">
			<div
				id="workspace"
				class="workspace"
				onclick={handleWorkspaceClick}
				onkeydown={handleWorkspaceKeydown}
				ondrop={handleWorkspaceDrop}
				ondragover={handleWorkspaceDragOver}
				role="button"
				tabindex="-1"
			>
				{#if children}
					{@render children()}
				{/if}

				<!-- Desktop shortcuts renderelése -->
				{#if desktopStore.iconsVisible}
					{#each desktopStore.shortcuts as shortcut (shortcut.id)}
						{@const appMetadata = apps.find((app) => app.appName === shortcut.appId) ?? null}
						<DesktopShortcut {shortcut} {appMetadata} />
					{/each}
				{/if}

				<!-- Ablakok renderelése -->
				{#each windowManager.windows as window (window.id)}
					<Window windowState={window} />
				{/each}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content class="z-1000">
			<ContextMenu.Item
				onclick={async () => {
					const settingsApp = await getAppByName('settings');
					if (settingsApp) {
						windowManager.openWindow(settingsApp.appName, settingsApp.title, settingsApp, {
							section: 'background'
						});
					}
				}}>{browser ? t('desktop.contextMenu.customizeBackground') : ''}</ContextMenu.Item
			>
			<ContextMenu.Separator />
			<ContextMenu.Item onclick={handleArrangeIcons}>
				{browser ? t('desktop.contextMenu.arrangeIcons') : ''}
			</ContextMenu.Item>
			<ContextMenu.Item onclick={handleToggleIcons}>
				{browser
					? desktopStore.iconsVisible
						? t('desktop.contextMenu.hideIcons')
						: t('desktop.contextMenu.showIcons')
					: ''}
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>

	<Taskbar {windowManager} />
	<CriticalNotificationDialog />
</div>

<style>
	.desktop {
		display: flex;
		position: relative;
		flex-direction: column;
		justify-content: space-between;
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
		/*background: url('/bg.jpg') center center / cover no-repeat fixed;*/
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	:global(.workspace-trigger) {
		display: flex;
		flex-grow: 1;
		order: 2;
	}

	.workspace {
		position: relative;
		flex-grow: 1;
		overflow: hidden;
	}

	.video-background {
		position: fixed;
		top: 0;
		left: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.image-background {
		position: fixed;
		top: 0;
		left: 0;
		z-index: -1;
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
	}

	.image-background.has-blur {
		/* Kicsit nagyítjuk, hogy a blur szélei ne legyenek láthatóak */
		transform: scale(1.05);
	}

	.video-background video {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: auto;
		min-width: 100%;
		height: auto;
		min-height: 100%;
		object-fit: cover;
	}
</style>
