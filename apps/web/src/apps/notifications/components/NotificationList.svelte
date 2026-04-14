<script lang="ts">
	import { untrack } from 'svelte';
	import { DataTable } from '$lib/components/ui/data-table';
	import type { PaginationInfo, DataTableState } from '$lib/components/ui/data-table';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { fetchNotifications } from '../notifications.remote';
	import type { Notification } from '@racona/database';
	import { createColumns } from './notificationListColumns';
	import { getNotificationStore } from '$lib/stores/notificationStore.svelte';
	import { toast } from 'svelte-sonner';

	const { t, locale } = useI18n();
	const shell = getAppShell();
	const notificationStore = getNotificationStore();

	function handleOpenNotification(notification: Notification) {
		shell.navigateTo('NotificationDetail', { notificationId: notification.id });
	}

	async function handleDeleteNotification(notification: Notification) {
		try {
			await notificationStore.deleteNotification(notification.id);
			toast.success(t('notifications.list.deleteSuccess'));
			await loadData();
		} catch (error) {
			console.error('Failed to delete notification:', error);
			toast.error(t('notifications.list.deleteError'));
		}
	}

	async function handleMarkAsRead(notification: Notification) {
		try {
			await notificationStore.markAsRead(notification.id);
			toast.success(t('notifications.list.markReadSuccess'));
			await loadData();
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
			toast.error(t('notifications.list.markReadError'));
		}
	}

	let data = $state<Notification[]>([]);
	let loading = $state(false);
	let paginationInfo = $state<PaginationInfo>({
		page: 1,
		pageSize: 20,
		totalCount: 0,
		totalPages: 0
	});
	let tableState = $state<DataTableState>({
		page: 1,
		pageSize: 20,
		sortBy: 'createdAt',
		sortOrder: 'desc'
	});

	let dataTable: DataTable<Notification>;
	const columns = $derived(
		createColumns({
			t,
			locale,
			onSort: (id, desc) => dataTable.handleSort(id, desc),
			onOpen: handleOpenNotification,
			onDelete: handleDeleteNotification,
			onMarkAsRead: handleMarkAsRead
		})
	);

	function handleStateChange(state: DataTableState) {
		tableState = state;
	}

	async function loadData() {
		loading = true;
		try {
			const result = await fetchNotifications({
				page: tableState.page,
				pageSize: tableState.pageSize,
				sortBy: tableState.sortBy,
				sortOrder: tableState.sortOrder
			});
			if (result.success) {
				data = result.data;
				paginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load notifications:', err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		tableState;
		untrack(() => loadData());
	});
</script>

<DataTable
	bind:this={dataTable}
	{columns}
	{data}
	pagination={paginationInfo}
	{loading}
	striped
	initialSortBy="createdAt"
	initialSortOrder="desc"
	onStateChange={handleStateChange}
/>
