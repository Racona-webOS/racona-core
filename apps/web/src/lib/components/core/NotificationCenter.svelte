<script lang="ts">
	import {
		Bell,
		RefreshCw,
		CheckCheck,
		X,
		Info,
		CheckCircle,
		AlertTriangle,
		XCircle,
		Trash2,
		Check
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import type { Notification } from '@racona/database';
	import { onMount } from 'svelte';
	import type { ComponentType } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { getTranslationStore } from '$lib/i18n/store.svelte';

	const { t } = useI18n();
	const i18nStore = getTranslationStore();
	const notificationStore = getNotificationStore();
	const windowManager = getWindowManager();

	// Get current locale reactively
	const currentLocale = $derived(i18nStore.currentLocale || 'hu');

	/**
	 * Get localized text from i18n content object
	 * Falls back to 'hu' if current locale is not available
	 */
	function getLocalizedText(content: any): string {
		if (typeof content === 'string') {
			return content; // Backward compatibility
		}
		if (content && typeof content === 'object') {
			return (
				content[currentLocale] || content['hu'] || content['en'] || Object.values(content)[0] || ''
			);
		}
		return '';
	}

	let open = $state(false);
	let panelElement: HTMLDivElement | undefined = $state();
	let portalTarget: HTMLDivElement | undefined = $state();

	// Close panel when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (open && panelElement && !panelElement.contains(event.target as Node)) {
			const trigger = document.querySelector('[data-notification-trigger]');
			if (trigger && !trigger.contains(event.target as Node)) {
				open = false;
			}
		}
	}

	onMount(() => {
		// Create portal target in body
		portalTarget = document.createElement('div');
		portalTarget.id = 'notification-portal';
		document.body.appendChild(portalTarget);

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			if (portalTarget) {
				document.body.removeChild(portalTarget);
			}
		};
	});

	// Get notifications and unread count reactively
	const notifications = $derived(notificationStore.notifications);
	const unreadCount = $derived(notificationStore.unreadCount);
	const hasUnreadCritical = $derived(notificationStore.hasUnreadCritical);

	async function handleNotificationClick(notification: Notification) {
		// Mark as read
		if (!notification.isRead) {
			notificationStore.markAsRead(notification.id);
		}

		// Open app if specified
		if (notification.appName) {
			try {
				// Get app metadata from registry
				const app = await getAppByName(notification.appName);

				if (app) {
					// Use app's original title and metadata
					windowManager.openWindow(
						notification.appName,
						app.title,
						app,
						(notification.data || {}) as any
					);
				} else {
					console.warn(`App not found: ${notification.appName}`);
				}
			} catch (error) {
				console.error('Failed to open app:', error);
			}
		}

		// Close panel
		open = false;
	}

	function handleMarkAllRead() {
		notificationStore.markAllAsRead();
	}

	async function handleDeleteNotification(notificationId: number, event: MouseEvent) {
		// Stop propagation to prevent opening the app
		event.stopPropagation();

		try {
			await notificationStore.deleteNotification(notificationId);
		} catch (error) {
			console.error('Failed to delete notification:', error);
		}
	}

	async function handleMarkAsRead(notificationId: number, event: MouseEvent) {
		// Stop propagation to prevent opening the app
		event.stopPropagation();

		try {
			await notificationStore.markAsRead(notificationId);
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
		}
	}

	async function handleDeleteAll() {
		try {
			await notificationStore.deleteAllNotifications();
		} catch (error) {
			console.error('Failed to delete all notifications:', error);
		}
	}

	async function handleViewDetails(notificationId: number, event: MouseEvent) {
		// Stop propagation to prevent opening the app
		event.stopPropagation();

		try {
			// Mark as read first
			await notificationStore.markAsRead(notificationId);

			// Get the notifications app from registry
			const app = await getAppByName('notifications');

			if (app) {
				// Open the notifications app with the specific notification ID
				windowManager.openWindow('notifications', app.title, app, {
					notificationId
				});
			} else {
				console.warn('Notifications app not found');
			}
		} catch (error) {
			console.error('Failed to open notifications app:', error);
		}

		// Close panel
		open = false;
	}

	function getNotificationIcon(type: string): ComponentType {
		switch (type) {
			case 'success':
				return CheckCircle;
			case 'warning':
				return AlertTriangle;
			case 'error':
			case 'critical':
				return XCircle;
			default:
				return Info;
		}
	}

	function getNotificationColor(type: string) {
		switch (type) {
			case 'success':
				return 'text-green-600 dark:text-green-400';
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'error':
			case 'critical':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-blue-600 dark:text-blue-400';
		}
	}

	// Render panel to portal
	$effect(() => {
		if (portalTarget && open) {
			const panel = panelElement;
			if (panel) {
				portalTarget.appendChild(panel);
			}
		}
	});
</script>

<button
	data-notification-trigger
	onclick={() => (open = !open)}
	class="taskbar-function-icon relative"
>
	<Bell class="h-5 w-5" />
	{#if hasUnreadCritical}
		<span
			class="absolute top-0.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 shadow-lg"
		>
			<span class="critical-icon text-[10px] font-bold text-black">!</span>
		</span>
	{/if}
	{#if unreadCount > 0}
		<span
			class="absolute top-1 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
		>
			{unreadCount > 99 ? '99+' : unreadCount}
		</span>
	{/if}
</button>

{#if open}
	<div
		bind:this={panelElement}
		class="notification-panel bg-background fixed top-[10px] right-[10px] bottom-[calc(3.5rem+10px)] z-[9999] flex w-[380px] flex-col rounded-lg border-2 shadow-2xl"
	>
		<div class="border-b px-4 py-3">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">{t('notifications.title')}</h3>
				<div class="flex items-center gap-1">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => notificationStore.reload()}
								>
									<RefreshCw class="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>{t('notifications.actions.refresh')}</Tooltip.Content>
						</Tooltip.Root>
						{#if unreadCount > 0}
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="ghost" size="icon" class="h-8 w-8" onclick={handleMarkAllRead}>
										<CheckCheck class="h-4 w-4" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>{t('notifications.actions.markAllRead')}</Tooltip.Content>
							</Tooltip.Root>
						{/if}
						{#if notifications.length > 0}
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="icon"
										class="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
										onclick={handleDeleteAll}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>{t('notifications.actions.deleteAll')}</Tooltip.Content>
							</Tooltip.Root>
						{/if}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => (open = false)}>
									<X class="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>{t('notifications.actions.close')}</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			</div>
		</div>

		<div class="custom-scrollbar flex-1 overflow-y-auto">
			{#if notifications.length === 0}
				<div class="text-muted-foreground flex flex-col items-center justify-center p-12">
					<Bell class="mb-3 h-12 w-12 opacity-20" />
					<p>{t('notifications.empty')}</p>
				</div>
			{:else}
				<div class="divide-y">
					{#each notifications as notification (notification.id)}
						{@const notifColor = getNotificationColor(notification.type)}
						{@const NotificationIcon = getNotificationIcon(notification.type)}
						{@const unreadBg = !notification.isRead ? 'bg-primary/5' : ''}
						<div class="group relative {unreadBg}">
							<div class="flex flex-col px-4 pt-3 pb-3">
								<div class="flex items-start gap-3">
									<div
										class="bg-opacity-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full {notifColor}"
									>
										<NotificationIcon class="h-5 w-5 {notifColor}" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="mb-1 flex items-start justify-between gap-2">
											<div class="flex flex-col gap-1">
												{#if notification.appName}
													<button
														onclick={() => handleNotificationClick(notification)}
														class="inline-block w-fit rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
													>
														{notification.appName}
													</button>
												{/if}
												<h4 class="flex items-center gap-2 text-sm font-semibold">
													{getLocalizedText(notification.title)}
													{#if !notification.isRead}
														<span class="h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>
													{/if}
												</h4>
											</div>
											<span class="text-muted-foreground text-xs whitespace-nowrap">
												{formatDistanceToNow(notification.createdAt)}
											</span>
										</div>
										<p class="text-muted-foreground text-sm leading-relaxed">
											{getLocalizedText(notification.message)}
										</p>
									</div>
								</div>
								<div class="ml-12 flex items-center justify-between">
									<button
										onclick={(e) => handleViewDetails(notification.id, e)}
										class="text-foreground hover:text-primary text-sm font-medium transition-colors"
									>
										{t('notifications.actions.viewDetails')}
									</button>
									<Tooltip.Provider>
										<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											{#if !notification.isRead}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<button
															onclick={(e) => handleMarkAsRead(notification.id, e)}
															class="rounded-md p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30"
														>
															<Check class="h-4 w-4 text-blue-600 dark:text-blue-400" />
														</button>
													</Tooltip.Trigger>
													<Tooltip.Content>{t('notifications.actions.markRead')}</Tooltip.Content>
												</Tooltip.Root>
											{/if}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<button
														onclick={(e) => handleDeleteNotification(notification.id, e)}
														class="rounded-md p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30"
													>
														<Trash2 class="h-4 w-4 text-red-600 dark:text-red-400" />
													</button>
												</Tooltip.Trigger>
												<Tooltip.Content>{t('notifications.actions.delete')}</Tooltip.Content>
											</Tooltip.Root>
										</div>
									</Tooltip.Provider>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.notification-panel {
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.critical-icon {
		animation: criticalPulse 1.5s ease-in-out infinite;
	}

	@keyframes criticalPulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
</style>
