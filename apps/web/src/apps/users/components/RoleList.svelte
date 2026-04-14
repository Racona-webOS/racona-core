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
	import { fetchRoles, createRole, deleteRole } from '../roles.remote';
	import type { RoleSelectModel } from '@racona/database/schemas';
	import { createColumns } from './roleListColumns';
	import { toast } from 'svelte-sonner';
	import Plus from 'lucide-svelte/icons/plus';

	const { t, locale } = useI18n();
	const shell = getAppShell();
	const actionBar = getActionBar();

	function handleOpenRole(role: RoleSelectModel) {
		shell.navigateTo('RoleDetail', { roleId: role.id }, '#roles');
	}

	let data = $state<RoleSelectModel[]>([]);
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
		sortBy: 'name',
		sortOrder: 'asc'
	});

	let dataTable: DataTable<RoleSelectModel>;
	const columns = $derived(
		createColumns({
			t,
			locale,
			onSort: (id, desc) => dataTable.handleSort(id, desc),
			onOpen: handleOpenRole,
			onDelete: handleDeleteRole
		})
	);

	function handleStateChange(state: DataTableState) {
		tableState = state;
	}

	async function loadData() {
		loading = true;
		try {
			const result = await fetchRoles({
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
			console.error('Failed to load roles:', err);
		} finally {
			loading = false;
		}
	}

	// --- Új szerepkör dialog ---
	let createDialogOpen = $state(false);
	let newRoleName = $state('');
	let newRoleDescription = $state('');
	let creating = $state(false);

	// --- Szerepkör törlés ---
	let deleteDialogOpen = $state(false);
	let roleToDelete = $state<RoleSelectModel | null>(null);

	function handleDeleteRole(role: RoleSelectModel) {
		roleToDelete = role;
		deleteDialogOpen = true;
	}

	function cancelDelete() {
		deleteDialogOpen = false;
		roleToDelete = null;
	}

	async function confirmDelete() {
		if (!roleToDelete) return;
		try {
			const result = await deleteRole({ roleId: roleToDelete.id });
			if (result.success) {
				toast.success(t('users.roles.delete.success'));
				deleteDialogOpen = false;
				roleToDelete = null;
				await loadData();
			} else {
				toast.error(result.error || t('users.roles.delete.error'));
			}
		} catch (err) {
			console.error('Failed to delete role:', err);
			toast.error(t('users.roles.delete.error'));
		}
	}

	function openCreateDialog() {
		createDialogOpen = true;
		newRoleName = '';
		newRoleDescription = '';
	}

	function closeCreateDialog() {
		createDialogOpen = false;
		newRoleName = '';
		newRoleDescription = '';
	}

	async function handleCreate() {
		if (!newRoleName.trim()) return;
		creating = true;
		try {
			const result = await createRole({
				name: newRoleName.trim(),
				description: newRoleDescription.trim() || undefined,
				locale
			});
			if (result.success) {
				toast.success(t('users.roles.create.success'));
				closeCreateDialog();
				await loadData();
			} else {
				toast.error(result.error || t('users.roles.create.error'));
			}
		} catch (err) {
			console.error('Failed to create role:', err);
			toast.error(t('users.roles.create.error'));
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
		{t('users.roles.create.button')}
	</Button>
{/snippet}

<div class="title-block">
	<h2>{t('users.roles.list.label')}</h2>
	<h3>{t('users.roles.list.description')}</h3>
</div>

<DataTable
	bind:this={dataTable}
	{columns}
	{data}
	pagination={paginationInfo}
	{loading}
	striped
	initialSortBy="name"
	initialSortOrder="asc"
	onStateChange={handleStateChange}
/>

<CustomDialog
	bind:open={createDialogOpen}
	title={t('users.roles.create.title')}
	onClose={closeCreateDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<div class="space-y-2">
				<label for="role-name" class="text-sm font-medium">{t('users.roles.detail.name')}</label>
				<Input id="role-name" bind:value={newRoleName} />
			</div>
			<div class="space-y-2">
				<label for="role-description" class="text-sm font-medium"
					>{t('users.roles.detail.description')}</label
				>
				<Input id="role-description" bind:value={newRoleDescription} />
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={closeCreateDialog} disabled={creating}>
			{t('common.buttons.cancel')}
		</Button>
		<Button onclick={handleCreate} disabled={!newRoleName.trim() || creating}>
			{creating ? t('common.loading') : t('users.roles.create.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('users.roles.delete.title')}
	description={roleToDelete
		? t('users.roles.delete.description', {
				name:
					typeof roleToDelete.name === 'object'
						? roleToDelete.name[locale] || Object.values(roleToDelete.name)[0] || ''
						: ''
			})
		: ''}
	confirmText={t('users.roles.delete.confirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>
