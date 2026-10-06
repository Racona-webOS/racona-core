<!--
 Mobil értesítéslista. Koppintásra olvasottnak jelöl, és ha az érintett app
 mobilon is megnyitható, megnyitja; különben jelzi, hogy asztali gépen érhető el.
 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Info, CheckCircle, AlertTriangle, XCircle, CheckCheck, Monitor } from 'lucide-svelte';
	import type { Notification } from '@racona/database';
	import { Button } from '$lib/components/ui/button';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { getWindowManager } from '$lib/stores';
	import { getApps } from '$lib/services/client/appRegistry';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import type { AppMetadata, AppParameters } from '$lib/types/window';
	import { canOpenOnMobile } from './mobileNavigation';

	const { t } = useI18n();
	const notificationStore = getNotificationStore();
	const windowManager = getWindowManager();
	const i18nStore = getTranslationStore();

	const currentLocale = $derived(i18nStore.currentLocale || 'hu');
	const notifications = $derived(notificationStore.notifications);
	const unreadCount = $derived(notificationStore.unreadCount);

	let apps = $state<AppMetadata[]>([]);

	onMount(() => {
		getApps()
			.then((result) => (apps = result))
			.catch((err) => console.error('[MobileNotifications] Failed to load apps:', err));
	});

	function getLocalizedText(content: unknown): string {
		if (typeof content === 'string') return content;
		if (content && typeof content === 'object') {
			const obj = content as Record<string, string>;
			return obj[currentLocale] || obj['hu'] || obj['en'] || Object.values(obj)[0] || '';
		}
		return '';
	}

	function targetOf(notification: Notification) {
		if (!notification.appName) return null;
		const app = apps.find((a) => a.appName === notification.appName);
		const parameters = (notification.data || {}) as AppParameters;
		return { app, parameters, openable: canOpenOnMobile(app, parameters) };
	}

	function handleClick(notification: Notification) {
		if (!notification.isRead) notificationStore.markAsRead(notification.id);

		const target = targetOf(notification);
		if (target?.openable && target.app) {
			windowManager.openWindow(target.app.appName, target.app.title, target.app, target.parameters);
		}
	}

	const ICONS: Record<string, typeof Info> = {
		success: CheckCircle,
		warning: AlertTriangle,
		error: XCircle,
		critical: XCircle
	};

	function iconColor(type: string) {
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
</script>

{#if notifications.length === 0}
	<p class="mobile-empty">{t('desktop.mobile.notifications.empty')}</p>
{:else}
	{#if unreadCount > 0}
		<div class="mb-3 flex justify-end">
			<Button variant="ghost" size="sm" onclick={() => notificationStore.markAllAsRead()}>
				<CheckCheck class="size-4" />
				{t('desktop.mobile.notifications.markAllRead')}
			</Button>
		</div>
	{/if}

	<ul class="notification-list">
		{#each notifications as notification (notification.id)}
			{@const Icon = ICONS[notification.type] ?? Info}
			{@const target = targetOf(notification)}
			<li>
				<button
					class="notification"
					class:unread={!notification.isRead}
					onclick={() => handleClick(notification)}
				>
					<Icon class="mt-0.5 size-5 shrink-0 {iconColor(notification.type)}" />
					<span class="notification-body">
						<span class="notification-title">{getLocalizedText(notification.title)}</span>
						<span class="notification-message">{getLocalizedText(notification.message)}</span>
						<span class="notification-meta">
							{formatDistanceToNow(notification.createdAt)}
							{#if target && !target.openable}
								<span class="desktop-only">
									<Monitor class="size-3" />
									{t('desktop.mobile.notifications.desktopOnly')}
								</span>
							{/if}
						</span>
					</span>
					{#if !notification.isRead}
						<span class="unread-dot" aria-hidden="true"></span>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.mobile-empty {
		padding: 3rem 1.5rem;
		color: var(--muted-foreground);
		text-align: center;
	}

	.notification-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.notification {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.875rem;
		background: var(--card);
		padding: 0.875rem;
		width: 100%;
		text-align: left;

		&:active {
			background: var(--muted);
		}

		&.unread .notification-title {
			font-weight: 600;
		}
	}

	.notification-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.notification-message {
		color: var(--muted-foreground);
		font-size: 0.875rem;
		line-height: 1.35;
	}

	.notification-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	.desktop-only {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.unread-dot {
		flex-shrink: 0;
		margin-top: 0.375rem;
		border-radius: 9999px;
		background: var(--primary);
		width: 0.5rem;
		height: 0.5rem;
	}
</style>
