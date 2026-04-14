<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { CustomDialog, ConfirmDialog } from '$lib/components/ui';
	import { DataTable } from '$lib/components/ui/data-table';
	import type { PaginationInfo, DataTableState } from '$lib/components/ui/data-table';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { fetchGroups, createGroup, deleteGroup } from '../groups.remote';
	import type { GroupSelectModel } from '@racona/database/schemas';
	import { createColumns } from './groupListColumns';
	import { toast } from 'svelte-sonner';
	import Plus from 'lucide-svelte/icons/plus';

	const { t, locale } = useI18n();
	const shell = getAppShell();
	const actionBar = getActionBar();

	function handleOpenGroup(group: GroupSelectModel) {
		shell.navigateTo('GroupDetail', { groupId: group.id }, '#groups');
	}

	let data = $state<GroupSelectModel[]>([]);
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

	let dataTable: DataTable<GroupSelectModel>;
	const columns = $derived(
		createColumns({
			t,
			locale,
			onSort: (id, desc) => dataTable.handleSort(id, desc),
			onOpen: handleOpenGroup,
			onDelete: handleDeleteGroup
		})
	);

	function handleStateChange(state: DataTableState) {
		tableState = state;
	}

	async function loadData() {
		loading = true;
		try {
			const result = await fetchGroups({
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
			console.error('Failed to load groups:', err);
		} finally {
			loading = false;
		}
	}

	// --- Új csoport dialog ---
	let createDialogOpen = $state(false);
	let newGroupName = $state('');
	let newGroupDescription = $state('');
	let creating = $state(false);

	// --- Csoport törlés ---
	let deleteDialogOpen = $state(false);
	let groupToDelete = $state<GroupSelectModel | null>(null);

	function handleDeleteGroup(group: GroupSelectModel) {
		groupToDelete = group;
		deleteDialogOpen = true;
	}

	function cancelDelete() {
		deleteDialogOpen = false;
		groupToDelete = null;
	}

	async function confirmDelete() {
		if (!groupToDelete) return;
		try {
			const result = await deleteGroup({ groupId: groupToDelete.id });
			if (result.success) {
				toast.success(t('users.groups.delete.success'));
				deleteDialogOpen = false;
				groupToDelete = null;
				await loadData();
			} else {
				toast.error(result.error || t('users.groups.delete.error'));
			}
		} catch (err) {
			console.error('Failed to delete group:', err);
			toast.error(t('users.groups.delete.error'));
		}
	}

	function openCreateDialog() {
		createDialogOpen = true;
		newGroupName = '';
		newGroupDescription = '';
	}

	function closeCreateDialog() {
		createDialogOpen = false;
		newGroupName = '';
		newGroupDescription = '';
	}

	async function handleCreate() {
		if (!newGroupName.trim()) return;
		creating = true;
		try {
			const result = await createGroup({
				name: newGroupName.trim(),
				description: newGroupDescription.trim() || undefined,
				locale
			});
			if (result.success) {
				toast.success(t('users.groups.create.success'));
				closeCreateDialog();
				await loadData();
			} else {
				toast.error(result.error || t('users.groups.create.error'));
			}
		} catch (err) {
			console.error('Failed to create group:', err);
			toast.error(t('users.groups.create.error'));
		} finally {
			creating = false;
		}
	}

	$effect(() => {
		tableState;
		untrack(() => loadData());
	});

	$effect(() => {
		actionBar.set(actionBarContent);
		return () => {
			actionBar.clear();
		};
	});
</script>

{#snippet actionBarContent()}
	<Button variant="default" size="sm" onclick={openCreateDialog}>
		<Plus class="mr-2 size-4" />
		{t('users.groups.create.button')}
	</Button>
{/snippet}

<div class="title-block">
	<h2>{t('users.groups.list.label')}</h2>
	<h3>{t('users.groups.list.description')}</h3>
</div>

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

<CustomDialog
	bind:open={createDialogOpen}
	title={t('users.groups.create.title')}
	onClose={closeCreateDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<div class="space-y-2">
				<label for="group-name" class="text-sm font-medium">{t('users.groups.detail.name')}</label>
				<Input id="group-name" bind:value={newGroupName} />
			</div>
			<div class="space-y-2">
				<label for="group-description" class="text-sm font-medium"
					>{t('users.groups.detail.description')}</label
				>
				<Input id="group-description" bind:value={newGroupDescription} />
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={closeCreateDialog} disabled={creating}>
			{t('common.buttons.cancel')}
		</Button>
		<Button onclick={handleCreate} disabled={!newGroupName.trim() || creating}>
			{creating ? t('common.loading') : t('users.groups.create.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('users.groups.delete.title')}
	description={groupToDelete
		? t('users.groups.delete.description', {
				name:
					typeof groupToDelete.name === 'object'
						? groupToDelete.name[locale] || Object.values(groupToDelete.name)[0] || ''
						: ''
			})
		: ''}
	confirmText={t('users.groups.delete.confirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>
