<script lang="ts">
	import { Menu } from 'lucide-svelte';
	import type { WindowManager } from '$lib/stores';
	import { getThemeManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import { UniversalIcon } from '$lib/components/shared';
	import StartMenu from './startmenu/StartMenu.svelte';
	import Clock from '$lib/components/ui/Clock.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import ThemeSwitcher from '$lib/components/ui/ThemeSwitcher.svelte';
	import WindowLink from '$lib/components/ui/WindowLink.svelte';
	import NotificationCenter from './NotificationCenter.svelte';
	import ChatCenter from './ChatCenter.svelte';
	import AIAssistantCenter from './AIAssistantCenter.svelte';
	import { getContext, onMount } from 'svelte';
	import { takeWindowScreenshot } from '$lib/services/client/screenshot';
	import { browser } from '$app/environment';
	import { useI18n } from '$lib/i18n/hooks';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { getChatStore } from '$apps/chat/stores/chatStore.svelte';
	import { isAIAgentEnabled } from '$apps/settings/admin-config.remote';

	const { t } = useI18n();

	let { windowManager }: { windowManager: WindowManager } = $props();

	const notificationStore = getNotificationStore();
	const chatStore = getChatStore();

	let aiAgentEnabled = $state(false);
	let aiAgentConfigured = $state(false);

	const settingsContext = getContext<{
		screenshotThumbnailHeight: number;
		windowPreview: boolean;
		preferPerformance: boolean;
		theme: {
			mode: 'light' | 'dark' | 'auto';
			modeTaskbarStartMenu: 'light' | 'dark' | 'auto';
			colorPrimaryHue: string;
			fontSize: 'small' | 'medium' | 'large';
		};
		taskbar: {
			position: 'top' | 'bottom' | 'left' | 'right';
			style: 'classic' | 'modern';
			itemVisibility: {
				clock: boolean;
				themeSwitcher: boolean;
				appGuidLink: boolean;
				messages?: boolean;
				notifications?: boolean;
				aiAssistant?: boolean;
			};
		};
	}>('settings');

	// Közvetlenül a kontextus getter-eket használjuk - nem hozunk létre új objektumot
	const settings = settingsContext;

	let startMenuOpen = $state(false);
	let isDraggingFromStartMenu = $state(false);

	// Kívüli kattintás figyelés: ha a start menü nyitva van és kívülre kattintanak, zárjuk be
	$effect(() => {
		if (!browser || !startMenuOpen) return;

		const handlePointerDown = (e: PointerEvent) => {
			if (isDraggingFromStartMenu) return;
			const target = e.target as Node;
			const content = document.querySelector('[data-startmenu-content]');
			const trigger = document.querySelector('[data-startmenu-trigger]');
			if (!content?.contains(target) && !trigger?.contains(target)) {
				startMenuOpen = false;
			}
		};

		document.addEventListener('pointerdown', handlePointerDown, { capture: true });

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
		};
	});

	// Drag figyelés: ha a start menüből húznak ki valamit, ne zárjuk be a popover-t
	$effect(() => {
		if (!browser) return;

		const handleDragStart = (e: DragEvent) => {
			if ((e.target as HTMLElement)?.closest?.('[data-slot="popover-content"]')) {
				isDraggingFromStartMenu = true;
			}
		};

		const handleDragEnd = () => {
			isDraggingFromStartMenu = false;
		};

		document.addEventListener('dragstart', handleDragStart);
		document.addEventListener('dragend', handleDragEnd);

		return () => {
			document.removeEventListener('dragstart', handleDragStart);
			document.removeEventListener('dragend', handleDragEnd);
		};
	});

	// ThemeManager csak kliens oldalon
	let themeManager = $state<ReturnType<typeof getThemeManager> | null>(null);

	$effect(() => {
		if (browser) {
			themeManager = getThemeManager();
		}
	});

	onMount(() => {
		// Ellenőrizzük az AI Agent státuszt
		const checkAIAgentStatus = async () => {
			try {
				const status = await isAIAgentEnabled({});
				aiAgentEnabled = status.enabled;
				aiAgentConfigured = status.configured;
			} catch (error) {
				console.error('[Taskbar] Error checking AI Agent status:', error);
			}
		};

		checkAIAgentStatus();

		// Hallgatjuk az AI Agent konfiguráció változásait
		const handleConfigChange = () => {
			// Kis késleltetéssel hívjuk meg, hogy a backend mentés befejeződjön
			setTimeout(() => {
				checkAIAgentStatus();
			}, 100);
		};

		window.addEventListener('ai-agent-config-changed', handleConfigChange);

		const element = document.querySelector('.border-gradient') as HTMLElement;

		let angle = 0;
		const rotateGradient = () => {
			angle = (angle + 1) % 360; // Increment angle faster (3 degrees per frame)
			element?.style.setProperty('--gradient-angle', `${angle}deg`);
			requestAnimationFrame(rotateGradient); // Smooth animation loop
		};

		rotateGradient(); // Start the animation

		// Cleanup
		return () => {
			window.removeEventListener('ai-agent-config-changed', handleConfigChange);
		};
	});

	// SSR-hez: effektív taskbar téma mód kiszámítása settings-ből
	function getEffectiveTaskbarMode() {
		if (settings.theme.modeTaskbarStartMenu === 'auto') {
			return 'dark'; // SSR fallback
		}
		return settings.theme.modeTaskbarStartMenu;
	}

	// CSS osztályok SSR-hez és kliens oldalhoz
	const taskbarCssClasses = $derived(
		themeManager
			? themeManager.cssClassesTaskBarStartMenu
			: `${getEffectiveTaskbarMode()} font-${settings.theme.fontSize}`
	);

	// Taskbar-specifikus CSS változók
	const taskbarCssVariables = $derived.by(() => {
		const mode = themeManager
			? themeManager.effectiveModeTaskBarStartMenu
			: getEffectiveTaskbarMode();

		// Taskbar színek a mód alapján
		if (mode === 'dark') {
			return {
				'--taskbar-background': 'oklch(20.463% 0.00002 271.152)',
				'--taskbar-foreground': 'oklch(82.968% 0.00009 271.152)',
				'--color-taskbar-background': 'oklch(20.463% 0.00002 271.152 / 0.8)',
				'--color-taskbar-foreground': 'oklch(82.968% 0.00009 271.152)',
				'--secondary': 'oklch(0.269 0 0)',
				'--color-secondary': 'oklch(0.269 0 0)',
				'--secondary-foreground': 'oklch(0.985 0 0)',
				'--popover': 'oklch(20.463% 0.00002 271.152 / 0.8)',
				'--color-popover': 'oklch(20.463% 0.00002 271.152 / 0.8)',
				'--popover-foreground': 'oklch(0.985 0 0)',
				'--color-popover-foreground': 'oklch(0.985 0 0)',
				'--taskbar-accent': 'oklch(0.269 0 0)',
				'--color-taskbar-accent': 'oklch(0.269 0 0)'
			};
		} else {
			return {
				'--taskbar-background': 'oklch(92.494% 0.00011 271.152)',
				'--taskbar-foreground': 'oklch(0.145 0 0)',
				'--color-taskbar-background': 'oklch(92.494% 0.00011 271.152 / 0.8)',
				'--color-taskbar-foreground': 'oklch(0.145 0 0)',
				'--secondary': 'oklch(0.97 0 0)',
				'--color-secondary': 'oklch(0.97 0 0)',
				'--secondary-foreground': 'oklch(0.205 0 0)',
				'--popover': 'oklch(1 0 0)',
				'--color-popover': 'oklch(1 0 0)',
				'--popover-foreground': 'oklch(0.145 0 0)',
				'--color-popover-foreground': 'oklch(0.145 0 0)',
				'--taskbar-accent': 'oklch(0.97 0 0)',
				'--color-taskbar-accent': 'oklch(0.97 0 0)'
			};
		}
	});

	// Taskbar kontext menü beállítások esemény
	const handleTaskbarSettings = async () => {
		const settingsApp = await getAppByName('settings');
		if (settingsApp) {
			windowManager.openWindow(settingsApp.appName, settingsApp.title, settingsApp, {
				section: 'taskbar'
			});
		}
	};

	const handleStartMenuSettings = async () => {
		const settingsApp = await getAppByName('settings');
		if (settingsApp) {
			windowManager.openWindow(settingsApp.appName, settingsApp.title, settingsApp, {
				section: 'start'
			});
		}
	};
</script>

<div
	class={[
		'taskbar',
		settings.taskbar.position === 'top' ? 'order-1' : 'order-3',
		settings.taskbar.style === 'modern' ? 'modern' : '',
		taskbarCssClasses
	]}
	style:--taskbar-background={taskbarCssVariables['--taskbar-background']}
	style:--taskbar-foreground={taskbarCssVariables['--taskbar-foreground']}
	style:--color-taskbar-background={taskbarCssVariables['--color-taskbar-background']}
	style:--color-taskbar-foreground={taskbarCssVariables['--color-taskbar-foreground']}
	style:--secondary={taskbarCssVariables['--secondary']}
	style:--color-secondary={taskbarCssVariables['--color-secondary']}
	style:--secondary-foreground={taskbarCssVariables['--secondary-foreground']}
	style:--taskbar-accent={taskbarCssVariables['--taskbar-accent']}
	style:--color-taskbar-accent={taskbarCssVariables['--color-taskbar-accent']}
>
	<ContextMenu.Root>
		<ContextMenu.Trigger class="taskbar-left-trigger">
			<div class="taskbar-left">
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					oncontextmenu={(e) => {
						e.stopPropagation();
					}}
				>
					<Popover.Root
						bind:open={startMenuOpen}
						onOpenChange={(v) => {
							if (!v && isDraggingFromStartMenu) return;
							startMenuOpen = v;
						}}
					>
						<Popover.Trigger
							class="btn-startmenu btn-click-effect border-gradient"
							data-startmenu-trigger
						>
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									<Menu size={24} />
								</ContextMenu.Trigger>
								<ContextMenu.Content class="z-1000">
									<ContextMenu.Item onclick={handleStartMenuSettings}
										>{t('desktop.contextMenu.customizeStartMenu')}</ContextMenu.Item
									>
								</ContextMenu.Content>
							</ContextMenu.Root>
						</Popover.Trigger>
						<Popover.Content
							class="z-1000 mx-2 my-2 flex w-(--startmenu-width) items-stretch"
							onInteractOutside={(e) => e.preventDefault()}
							data-startmenu-content><StartMenu bind:open={startMenuOpen} /></Popover.Content
						>
					</Popover.Root>
				</div>

				{#each windowManager.windows as window (window.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="taskbar-item-wrapper"
						oncontextmenu={(e) => {
							e.stopPropagation();
						}}
					>
						<button
							class="taskbar-item"
							class:active={window.isActive}
							class:minimized={window.isMinimized}
							onclick={async () => {
								if (window.isMinimized) {
									// Ha minimalizált, visszaállítjuk és aktiváljuk
									await windowManager.minimizeWindow(window.id);
								} else if (window.isActive) {
									// Ha aktív, minimalizáljuk (screenshot-tal)
									await windowManager.minimizeWindow(window.id, async () => {
										if (settings.windowPreview && !settings.preferPerformance) {
											await takeWindowScreenshot(
												window.id,
												windowManager,
												settings.screenshotThumbnailHeight
											);
										}
									});
								} else {
									// Ha inaktív (de nem minimalizált), aktiváljuk
									windowManager.activateWindow(window.id);
								}
							}}
						>
							<div class="taskbar-item-icon">
								<UniversalIcon icon={window.icon ?? ''} size={24} appName={window.appName} />
								{#if window.appName}
									{@const appUnreadCount =
										window.appName === 'chat'
											? chatStore.unreadCount
											: notificationStore.getAppUnreadCount(window.appName)}
									{#if appUnreadCount > 0}
										<span class="app-notification-badge">
											{appUnreadCount > 9 ? '9+' : appUnreadCount}
										</span>
									{/if}
								{/if}
							</div>
							<div class="taskbar-item-title">
								<span>{window.title}</span>
							</div>
						</button>
						{#if window.screenshot && settings.windowPreview && !settings.preferPerformance}
							<div class="screenshot-preview">
								<img
									style:height="{settings.screenshotThumbnailHeight}px"
									src={window.screenshot}
									alt="{window.title} preview"
								/>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content class="z-1000">
			<ContextMenu.Item onclick={handleTaskbarSettings}
				>{t('desktop.contextMenu.customizeTaskbar')}</ContextMenu.Item
			>
		</ContextMenu.Content>
	</ContextMenu.Root>
	<div class="taskbar-right">
		{#if settings.taskbar.itemVisibility.appGuidLink ?? true}
			<WindowLink />
		{/if}
		{#if settings.taskbar.itemVisibility.messages ?? true}
			<ChatCenter />
		{/if}
		{#if (settings.taskbar.itemVisibility.aiAssistant ?? true) && aiAgentEnabled && aiAgentConfigured}
			<AIAssistantCenter />
		{/if}
		{#if settings.taskbar.itemVisibility.notifications ?? true}
			<NotificationCenter />
		{/if}
		{#if settings.taskbar.itemVisibility.themeSwitcher ?? true}
			<ThemeSwitcher />
		{/if}
		{#if settings.taskbar.itemVisibility.clock ?? true}
			<Clock />
		{/if}
	</div>
</div>

<style>
	@reference "tailwindcss";
	@custom-variant dark (&:is(.dark *));

	.taskbar {
		display: flex;
		justify-content: space-between;
		z-index: var(--taskbar-z-index);
		backdrop-filter: blur(10px);
		border-radius: 0;
		background-color: var(--color-taskbar-background);
		color: var(--color-taskbar-foreground);

		&.modern {
			margin: 10px;
			border-radius: 999px;
		}

		:global(.taskbar-left-trigger) {
			display: flex;
			flex-grow: 1;
		}

		.taskbar-left {
			display: flex;
			flex-grow: 1;
			justify-content: start;
			align-items: stretch;
			gap: 5px;
		}

		.taskbar-right {
			display: flex;
			justify-content: start;
			align-items: stretch;
			gap: 10px;
			padding-right: 16px;
		}

		.taskbar-item-wrapper {
			display: flex;
			position: relative;
			align-items: stretch;

			&:hover .screenshot-preview {
				transform: translateY(-8px);
				visibility: visible;
				opacity: 1;
			}
		}

		.taskbar-item {
			display: flex;
			align-items: center;
			gap: 10px;
			transition: all 0.2s;
			cursor: pointer;
			margin: 5px 0;
			border-radius: var(--radius-sm);
			padding: 0 10px;

			.taskbar-item-title {
				display: flex;
				align-items: stretch;
				max-width: 200px;
				color: var(--taskbar-item-text-color);
				font-size: 0.85rem;

				& > span {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}

			&.active {
				box-shadow:
					var(--shadow-sm),
					0px 15px 20px -15px rgba(from var(--color-primary) r g b / 0.8);
			}

			&:hover {
				background-color: var(--color-taskbar-accent) !important;
			}

			.taskbar-item-icon {
				display: flex;
				position: relative;
				align-items: stretch;
				transition: filter 0.2s ease-in-out;
			}

			.app-notification-badge {
				display: flex;
				position: absolute;
				top: -4px;
				right: -4px;
				justify-content: center;
				align-items: center;
				border-radius: 999px;
				background-color: var(--color-destructive);
				padding: 0 4px;
				min-width: 16px;
				height: 16px;
				color: var(--color-destructive-foreground);
				font-weight: 600;
				font-size: 0.65rem;
				line-height: 1;
			}

			&.minimized {
				opacity: 0.7;
				background-color: transparent;

				.taskbar-item-icon {
					filter: grayscale(1);
				}
			}
		}

		.screenshot-preview {
			position: absolute;
			bottom: 100%;
			left: 0;
			/*transform: translateX(-50%) translateY(0);*/
			visibility: hidden;
			opacity: 0;
			z-index: 1000;
			backdrop-filter: blur(12px);
			transition:
				opacity 0.2s,
				visibility 0.2s,
				transform 0.2s;
			margin-bottom: 8px;
			box-shadow: var(--shadow-lg);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-md);
			background-color: var(--color-popover);
			padding: 8px;
			pointer-events: none;

			img {
				display: block;
				border-radius: var(--radius-sm);
				max-width: none;
				/*height: 200px;*/
				object-fit: contain;
			}
		}
	}

	:global(.btn-startmenu) {
		@apply mx-2 my-1 h-full;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: background-color 0.2s;
		cursor: pointer;
		border-radius: var(--radius-sm);
		/*background-color: var(--color-primary-alpha-60);*/
		background-color: var(--color-secondary);
		aspect-ratio: 1;
		height: 45px;
		/*color: var(--color-neutral-100);*/
		color: var(--color-taskbar-foreground);

		&[data-state='open'] {
			/*background-color: var(--color-primary-alpha-80);*/
		}
	}

	:global(.modern .btn-startmenu) {
		border-radius: 999px;
		@apply mx-1;
	}

	:global {
		.btn-startmenu[data-state='open'],
		.border-gradient:hover {
			--c: var(--primary);
			--p: 10%;
			--gradient-bg: var(--color-stone-200);
			--gradient-l-mult: 1.1;
			--conic-color: var(--color-stone-400);
			border: 2px solid transparent;
			background:
				linear-gradient(
						135deg,
						oklch(from var(--color-primary) calc(l * var(--gradient-l-mult)) c h),
						var(--gradient-bg)
					)
					padding-box,
				conic-gradient(
						from var(--gradient-angle, 0deg),
						transparent,
						var(--conic-color) var(--p),
						transparent calc(var(--p) * 2)
					)
					border-box;
		}

		.dark .btn-startmenu[data-state='open'],
		.dark .border-gradient:hover {
			--gradient-bg: var(--color-stone-800);
			--gradient-l-mult: 0.9;
			--conic-color: white;
		}

		/* Global taskbar function icon style */
		.taskbar-function-icon {
			display: flex;
			justify-content: center;
			align-items: center;
			transition: background-color 0.2s;
			border-radius: var(--radius-md);
			padding: 0 0.5rem;
			height: 100%;
		}

		.taskbar-function-icon:hover {
			background-color: var(--color-taskbar-accent);
		}
	}
</style>
