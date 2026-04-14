<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { ConfirmDialog } from '$lib/components/ui';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Check from 'lucide-svelte/icons/check';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import type { Notification } from '@racona/database';
	import { toast } from 'svelte-sonner';

	interface Props {
		notificationId: number;
	}

	let { notificationId }: Props = $props();

	const shell = getAppShell();
	const actionBar = getActionBar();
	const { t } = useI18n();
	const i18nStore = getTranslationStore();
	const notificationStore = getNotificationStore();
	const windowManager = getWindowManager();

	const currentLocale = $derived(i18nStore.currentLocale || 'hu');

	let notification = $state<Notification | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let deleteDialogOpen = $state(false);

	/**
	 * Get localized text from i18n content object.
	 */
	function getLocalizedText(content: unknown): string {
		if (typeof content === 'string') {
			return content; // Backward compatibility
		}
		if (content && typeof content === 'object') {
			const obj = content as Record<string, string>;
			return obj[currentLocale] || obj['hu'] || obj['en'] || Object.values(obj)[0] || '';
		}
		return '';
	}

	function handleBack() {
		actionBar.clear();
		shell.navigateTo('NotificationList');
	}

	function handleDelete() {
		deleteDialogOpen = true;
	}

	function cancelDelete() {
		deleteDialogOpen = false;
	}

	async function confirmDelete() {
		if (!notification) return;
		try {
			await notificationStore.deleteNotification(notification.id);
			toast.success(t('notifications.detail.deleteSuccess'));
			deleteDialogOpen = false;
			actionBar.clear();
			shell.navigateTo('NotificationList');
		} catch (err) {
			console.error('Failed to delete notification:', err);
			toast.error(t('notifications.detail.deleteError'));
		}
	}

	async function handleMarkAsRead() {
		if (!notification || notification.isRead) return;
		try {
			await notificationStore.markAsRead(notification.id);
			toast.success(t('notifications.detail.markReadSuccess'));
			await loadData();
		} catch (err) {
			console.error('Failed to mark notification as read:', err);
			toast.error(t('notifications.detail.markReadError'));
		}
	}

	async function handleOpenApp() {
		if (!notification || !notification.appName) return;
		try {
			const app = await getAppByName(notification.appName);
			if (app) {
				windowManager.openWindow(
					notification.appName,
					app.title,
					app,
					(notification.data || {}) as any
				);
				toast.success(t('notifications.detail.appOpened'));
			}
		} catch (error) {
			console.error('Failed to open app:', error);
			toast.error(t('notifications.detail.appOpenError'));
		}
	}

	async function loadData() {
		const id = notificationId;
		if (id == null || id <= 0) return;
		loading = true;
		error = null;
		try {
			// Get notification from store
			const notifications = notificationStore.notifications;
			const found = notifications.find((n) => n.id === id);
			if (found) {
				notification = found;
				actionBar.set(actionBarContent);
			} else {
				error = t('notifications.detail.notFound');
			}
		} catch (err) {
			console.error('Failed to load notification:', err);
			error = t('notifications.detail.error');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		notificationId;
		untrack(() => loadData());
	});

	$effect(() => {
		return () => {
			actionBar.clear();
		};
	});

	const title = $derived(notification ? getLocalizedText(notification.title) : '');
	const message = $derived(notification ? getLocalizedText(notification.message) : '');
	const details = $derived(notification?.details ? getLocalizedText(notification.details) : null);
</script>

{#snippet actionBarContent()}
	<div class="flex gap-2">
		{#if notification && !notification.isRead}
			<Button variant="default" size="sm" onclick={handleMarkAsRead}>
				<Check class="mr-2 size-4" />
				{t('notifications.detail.markAsRead')}
			</Button>
		{/if}
		{#if notification?.appName}
			<Button variant="default" size="sm" onclick={handleOpenApp}>
				{t('notifications.detail.openApp')}
			</Button>
		{/if}
		<Button variant="destructive" size="sm" onclick={handleDelete}>
			<Trash2 class="mr-2 size-4" />
			{t('notifications.detail.delete')}
		</Button>
	</div>
{/snippet}

<div class="title-block">
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" class="size-8" onclick={handleBack}>
			<ArrowLeft class="size-4" />
			<span class="sr-only">{t('common.buttons.back')}</span>
		</Button>
		<h2>{t('notifications.detail.title')}</h2>
	</div>
</div>

{#if loading}
	<div class="flex items-center justify-center py-8">
		<p class="text-muted-foreground">{t('common.loading')}</p>
	</div>
{:else if error}
	<div class="flex items-center justify-center py-8">
		<p class="text-destructive">{error}</p>
	</div>
{:else if notification}
	<div class="space-y-6">
		<div class="space-y-4">
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('notifications.detail.notificationTitle')}
				</div>
				<p class="text-base font-semibold">{title}</p>
			</div>
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('notifications.detail.message')}
				</div>
				<p class="text-base">{message}</p>
			</div>
			{#if details}
				<div>
					<div class="text-muted-foreground text-sm font-medium">
						{t('notifications.detail.details')}
					</div>
					<p class="text-base">{details}</p>
				</div>
			{/if}
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('notifications.detail.type')}
				</div>
				<p class="text-base capitalize">{notification.type}</p>
			</div>
			{#if notification.appName}
				<div>
					<div class="text-muted-foreground text-sm font-medium">
						{t('notifications.detail.app')}
					</div>
					<p class="text-base">{notification.appName}</p>
				</div>
			{/if}
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('notifications.detail.status')}
				</div>
				<p class="text-base">
					{notification.isRead ? t('notifications.detail.read') : t('notifications.detail.unread')}
				</p>
			</div>
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('notifications.detail.createdAt')}
				</div>
				<p class="text-base">
					{new Date(notification.createdAt).toLocaleString('hu-HU', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</p>
			</div>
			{#if notification.readAt}
				<div>
					<div class="text-muted-foreground text-sm font-medium">
						{t('notifications.detail.readAt')}
					</div>
					<p class="text-base">
						{new Date(notification.readAt).toLocaleString('hu-HU', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('notifications.detail.deleteTitle')}
	description={notification ? t('notifications.detail.deleteDescription', { title }) : ''}
	confirmText={t('notifications.detail.deleteConfirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>
