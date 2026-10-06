<!--
 Mobil keret: az asztali felület (ablakok, tálca) helyett telefonon.
 Egyszerre egy app látszik teljes képernyőn; alul kezdőlap, értesítések,
 megnyitott appok és profil. A nézet a böngészőelőzményben él (shallow routing),
 így a telefon vissza gesztusa az előző nézetre lép.

 Az ablakkezelő ugyanaz, mint asztalon: bármi, ami ablakot nyit (kezdőképernyő,
 értesítés, egy app hívása), az aktív ablakot teljes képernyőn mutatja.
 -->
<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate, pushState, replaceState } from '$app/navigation';
	import { House, Bell, Layers, CircleUser, ChevronLeft, X } from 'lucide-svelte';
	import { getWindowManager } from '$lib/stores';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import WindowContent from '../window/WindowContent.svelte';
	import CriticalNotificationDialog from '../CriticalNotificationDialog.svelte';
	import MobileHome from './MobileHome.svelte';
	import MobileNotifications from './MobileNotifications.svelte';
	import MobileOpenApps from './MobileOpenApps.svelte';
	import MobileProfile from './MobileProfile.svelte';

	type Panel = NonNullable<App.PageState['mobilePanel']>;

	let { appName, children }: { appName: string; children?: Snippet } = $props();

	const { t } = useI18n();
	const windowManager = getWindowManager();
	const notificationStore = getNotificationStore();

	/**
	 * Az aktuális nézet saját másolata. A page.state-et a SvelteKit minden
	 * invalidate() hívásnál (pl. témaváltás, beállítás-mentés) üresre állítja, az
	 * előzmény-bejegyzés viszont megmarad. Ezért csak a saját navigációnkkor és
	 * előzmény-lépéskor (vissza, előre) vesszük át.
	 */
	let nav = $state<App.PageState>({ ...page.state });

	function navPush(state: App.PageState) {
		pushState('', state);
		nav = state;
	}

	function navReplace(state: App.PageState) {
		replaceState('', state);
		nav = state;
	}

	onMount(() => {
		// A SvelteKit a saját popstate kezelőjében (előbb regisztrálva) szinkron frissíti a page.state-et
		const syncFromHistory = () => (nav = { ...page.state });
		window.addEventListener('popstate', syncFromHistory);
		return () => window.removeEventListener('popstate', syncFromHistory);
	});

	// Újratöltés utáni vissza lépésnél a SvelteKit teljes navigációt végez
	afterNavigate(({ type }) => {
		if (type === 'popstate') nav = { ...page.state };
	});

	const panel = $derived(nav.mobilePanel);
	const currentWindow = $derived(
		nav.mobileWindowId ? windowManager.windows.find((w) => w.id === nav.mobileWindowId) : undefined
	);
	const view = $derived<Panel | 'app' | 'home'>(panel ?? (currentWindow ? 'app' : 'home'));
	const unreadCount = $derived(notificationStore.unreadCount);
	const openCount = $derived(windowManager.windows.length);

	const title = $derived.by(() => {
		switch (view) {
			case 'app':
				return currentWindow?.title ?? '';
			case 'notifications':
				return t('desktop.mobile.notifications.title');
			case 'apps':
				return t('desktop.mobile.openApps.title');
			case 'profile':
				return t('desktop.mobile.profile.title');
			default:
				return appName;
		}
	});

	// Ha egy ablak aktívvá válik (megnyitás bárhonnan), azt mutatjuk teljes képernyőn,
	// új előzmény-bejegyzéssel, hogy a vissza gesztus az előző nézetre vigyen
	$effect(() => {
		const active = windowManager.windows.find((w) => w.isActive && !w.isMinimized);
		if (!active) return;
		untrack(() => {
			if (active.id !== nav.mobileWindowId || nav.mobilePanel) {
				navPush({ mobileWindowId: active.id });
			}
		});
	});

	// A nézethez igazítjuk az ablakok aktív állapotát
	// (vissza és előre lépéskor, illetve a kezdőképernyőre érve)
	$effect(() => {
		const id = nav.mobileWindowId;
		untrack(() => {
			if (!id) {
				if (windowManager.windows.some((w) => w.isActive)) windowManager.deactivateAllWindows();
				return;
			}
			const target = windowManager.windows.find((w) => w.id === id);
			if (target && !target.isActive) windowManager.activateWindow(id);
		});
	});

	function goHome() {
		if (view !== 'home') navPush({});
	}

	function openPanel(target: Panel) {
		if (panel === target) return;
		// Panelek között váltva nem halmozzuk az előzményt
		if (panel) navReplace({ mobilePanel: target });
		else navPush({ mobilePanel: target });
	}

	/** Egy megnyitott app megjelenítése a panel helyén (a vissza a panel előtti nézetre visz) */
	function showWindow(id: string) {
		navReplace({ mobileWindowId: id });
	}

	function closeCurrentApp() {
		if (!currentWindow) return;
		windowManager.closeWindow(currentWindow.id);
		// A bezárás a legfelső másik ablakot aktiválná: mobilon az előző nézetre lépünk vissza
		windowManager.deactivateAllWindows();
		history.back();
	}
</script>

<div class="mobile-shell bg-background text-foreground">
	<header class="mobile-header">
		{#if view === 'home'}
			<div class="mobile-header-spacer"></div>
		{:else}
			<button
				class="mobile-icon-button"
				onclick={() => history.back()}
				aria-label={t('desktop.mobile.back')}
			>
				<ChevronLeft class="size-6" />
			</button>
		{/if}
		<h1 class="mobile-title">{title}</h1>
		{#if view === 'app'}
			<button
				class="mobile-icon-button"
				onclick={closeCurrentApp}
				aria-label={t('desktop.mobile.close')}
			>
				<X class="size-5" />
			</button>
		{:else}
			<div class="mobile-header-spacer"></div>
		{/if}
	</header>

	<main class="mobile-main">
		<!-- A megnyitott appok mind élnek (állapotuk megmarad), csak az aktuális látszik -->
		{#each windowManager.windows as windowState (windowState.id)}
			<div class="mobile-view mobile-app" hidden={view !== 'app' || windowState.id !== currentWindow?.id}>
				<WindowContent {windowState} />
			</div>
		{/each}

		{#if view === 'home'}
			<div class="mobile-view">
				<MobileHome />
				{@render children?.()}
			</div>
		{:else if view === 'notifications'}
			<div class="mobile-view">
				<MobileNotifications />
			</div>
		{:else if view === 'apps'}
			<div class="mobile-view">
				<MobileOpenApps onShow={showWindow} />
			</div>
		{:else if view === 'profile'}
			<div class="mobile-view">
				<MobileProfile />
			</div>
		{/if}
	</main>

	<nav class="mobile-nav">
		<button class="mobile-nav-item" class:active={view === 'home'} onclick={goHome}>
			<House class="size-5" />
			<span>{t('desktop.mobile.nav.home')}</span>
		</button>
		<button
			class="mobile-nav-item"
			class:active={view === 'notifications'}
			onclick={() => openPanel('notifications')}
		>
			<span class="mobile-nav-icon">
				<Bell class="size-5" />
				{#if unreadCount > 0}
					<span class="mobile-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
				{/if}
			</span>
			<span>{t('desktop.mobile.nav.notifications')}</span>
		</button>
		<button
			class="mobile-nav-item"
			class:active={view === 'apps' || view === 'app'}
			onclick={() => openPanel('apps')}
		>
			<span class="mobile-nav-icon">
				<Layers class="size-5" />
				{#if openCount > 0}
					<span class="mobile-badge neutral">{openCount}</span>
				{/if}
			</span>
			<span>{t('desktop.mobile.nav.openApps')}</span>
		</button>
		<button
			class="mobile-nav-item"
			class:active={view === 'profile'}
			onclick={() => openPanel('profile')}
		>
			<CircleUser class="size-5" />
			<span>{t('desktop.mobile.nav.profile')}</span>
		</button>
	</nav>

	<CriticalNotificationDialog />
</div>

<style>
	.mobile-shell {
		display: flex;
		position: fixed;
		inset: 0;
		flex-direction: column;
		height: 100dvh;
		overflow: hidden;
	}

	.mobile-header {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.25rem;
		border-bottom: 1px solid var(--border);
		padding: env(safe-area-inset-top) max(0.5rem, env(safe-area-inset-right)) 0
			max(0.5rem, env(safe-area-inset-left));
		height: calc(3.25rem + env(safe-area-inset-top));
	}

	.mobile-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		font-weight: 600;
		font-size: 1.0625rem;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile-icon-button,
	.mobile-header-spacer {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		width: 2.75rem;
		height: 2.75rem;
	}

	.mobile-icon-button {
		border-radius: 9999px;

		&:active {
			background: var(--muted);
		}
	}

	.mobile-main {
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.mobile-view {
		position: absolute;
		inset: 0;
		padding: 1rem max(1rem, env(safe-area-inset-right)) 1.5rem max(1rem, env(safe-area-inset-left));
		overflow-y: auto;
		overscroll-behavior: contain;

		&[hidden] {
			display: none;
		}
	}

	.mobile-nav {
		display: flex;
		flex-shrink: 0;
		border-top: 1px solid var(--border);
		padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
	}

	.mobile-nav-item {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.125rem;
		height: 3.5rem;
		color: var(--muted-foreground);
		font-size: 0.6875rem;

		&.active {
			color: var(--primary);
		}
	}

	.mobile-nav-icon {
		position: relative;
		display: flex;
	}

	.mobile-badge {
		display: flex;
		position: absolute;
		top: -0.375rem;
		right: -0.75rem;
		justify-content: center;
		align-items: center;
		border-radius: 9999px;
		background: #ef4444;
		padding: 0 0.3rem;
		min-width: 1.125rem;
		height: 1.125rem;
		color: white;
		font-weight: 700;
		font-size: 0.625rem;

		&.neutral {
			background: var(--muted-foreground);
		}
	}
</style>
