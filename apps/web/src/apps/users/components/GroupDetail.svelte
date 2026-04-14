<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { useId } from 'bits-ui';
	import { Button } from '$lib/components/ui/button';
	import { ButtonEdit, ButtonSave, ButtonCancel } from '$lib/components/shared/buttons';
	import { Input } from '$lib/components/ui/input';
	import { CustomDialog, ConfirmDialog } from '$lib/components/ui';
	import { DataTable } from '$lib/components/ui/data-table';
	import type { PaginationInfo } from '$lib/components/ui/data-table';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { cn } from '$lib/utils/utils';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import ShieldPlus from 'lucide-svelte/icons/shield-plus';
	import AppWindow from 'lucide-svelte/icons/app-window';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import {
		fetchGroup,
		fetchGroupUsers,
		fetchGroupPermissions,
		fetchGroupApps,
		updateGroup,
		deleteGroup,
		addUserToGroup,
		fetchAvailableUsers,
		removeUserFromGroup,
		fetchAvailablePermissionsForGroup,
		addPermissionToGroup,
		removePermissionFromGroup,
		fetchAvailableAppsForGroup,
		addAppToGroup,
		removeAppFromGroup
	} from '../groups.remote';
	import type { GroupSelectModel, UserSelectModel } from '@racona/database/schemas';
	import type { GroupPermissionRow, GroupAppRow } from '$lib/server/database/repositories';
	import type { DataTableState } from '$lib/components/ui/data-table';
	import { createColumns as createUserColumns } from './groupDetailUserColumns';
	import { createColumns as createPermissionColumns } from './groupDetailPermissionColumns';
	import { createColumns as createAppColumns } from './groupDetailAppColumns';
	import { toast } from 'svelte-sonner';

	interface Props {
		groupId: number;
	}

	let { groupId }: Props = $props();

	const shell = getAppShell();
	const actionBar = getActionBar();
	const { t, locale } = useI18n();
	const windowManager = getWindowManager();

	let group = $state<GroupSelectModel | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let activeTab = $state('members');
	let editing = $state(false);

	// Szerkesztési form state
	let formName = $state('');
	let formDescription = $state('');

	// Felhasználó hozzáadás dialog állapot
	let userDialogOpen = $state(false);
	let userComboboxOpen = $state(false);
	let availableUsers = $state<UserSelectModel[]>([]);
	let selectedUserId = $state<string>('');
	let addingUser = $state(false);

	// Felhasználó eltávolítás dialog állapot
	let removeUserDialogOpen = $state(false);
	let userToRemove = $state<UserSelectModel | null>(null);

	// Jogosultság hozzáadás dialog állapot
	let permDialogOpen = $state(false);
	let permComboboxOpen = $state(false);
	let availablePermissions = $state<GroupPermissionRow[]>([]);
	let selectedPermissionId = $state<string>('');
	let addingPermission = $state(false);

	// Jogosultság eltávolítás dialog állapot
	let removePermDialogOpen = $state(false);
	let permissionToRemove = $state<GroupPermissionRow | null>(null);

	// App hozzáadás dialog állapot
	let appDialogOpen = $state(false);
	let appComboboxOpen = $state(false);
	let availableApps = $state<GroupAppRow[]>([]);
	let selectedAppId = $state<string>('');
	let addingApp = $state(false);

	// App eltávolítás dialog állapot
	let removeAppDialogOpen = $state(false);
	let appToRemove = $state<GroupAppRow | null>(null);

	const userTriggerId = useId();
	const permTriggerId = useId();
	const appTriggerId = useId();

	function handleBack() {
		actionBar.clear();
		shell.navigateTo('GroupList');
	}

	// --- Törlés ---

	let deleteDialogOpen = $state(false);

	function handleDelete() {
		deleteDialogOpen = true;
	}

	function cancelDelete() {
		deleteDialogOpen = false;
	}

	async function confirmDelete() {
		if (!group) return;
		try {
			const result = await deleteGroup({ groupId: group.id });
			if (result.success) {
				toast.success(t('users.groups.delete.success'));
				deleteDialogOpen = false;
				actionBar.clear();
				shell.navigateTo('GroupList');
			} else {
				toast.error(result.error || t('users.groups.delete.error'));
			}
		} catch (err) {
			console.error('Failed to delete group:', err);
			toast.error(t('users.groups.delete.error'));
		}
	}

	// --- Szerkesztés ---

	function resolveText(value: unknown, loc: string): string {
		if (!value || typeof value !== 'object') return '';
		const obj = value as Record<string, string>;
		return obj[loc] || obj['en'] || Object.values(obj)[0] || '';
	}

	function startEditing() {
		if (!group) return;
		formName = resolveText(group.name, locale);
		formDescription = resolveText(group.description, locale);
		editing = true;
		actionBar.set(editingActions);
	}

	function cancelEditing() {
		editing = false;
		actionBar.set(actionBarContent);
	}

	async function handleSave() {
		if (!group || !formName.trim()) return;
		try {
			const result = await updateGroup({
				groupId: group.id,
				name: formName.trim(),
				description: formDescription.trim() || undefined,
				locale
			});
			if (result.success) {
				toast.success(t('users.groups.edit.saveSuccess'));
				editing = false;
				await loadData();
			} else {
				toast.error(result.error || t('users.groups.edit.saveError'));
			}
		} catch (err) {
			console.error('Failed to update group:', err);
			toast.error(t('users.groups.edit.saveError'));
		}
	}

	// --- Felhasználó műveletek ---

	function handleOpenUser(user: UserSelectModel) {
		shell.navigateTo(
			'UserDetail',
			{ userId: user.id, returnTo: 'GroupDetail', groupId },
			'#groups'
		);
	}

	function handleRemoveUser(user: UserSelectModel) {
		userToRemove = user;
		removeUserDialogOpen = true;
	}

	function cancelRemoveUser() {
		removeUserDialogOpen = false;
		userToRemove = null;
	}

	async function confirmRemoveUser() {
		if (!userToRemove) return;
		try {
			const result = await removeUserFromGroup({ userId: userToRemove.id, groupId });
			if (result.success) {
				toast.success(t('users.groups.removeUser.success'));
				removeUserDialogOpen = false;
				userToRemove = null;
				await loadUsers();
			} else {
				toast.error(result.error || t('users.groups.removeUser.error'));
			}
		} catch (err) {
			console.error('Failed to remove user from group:', err);
			toast.error(t('users.groups.removeUser.error'));
		}
	}

	async function openAddUserDialog() {
		userDialogOpen = true;
		selectedUserId = '';
		userComboboxOpen = false;
		const result = await fetchAvailableUsers({ groupId });
		if (result.success) {
			availableUsers = result.data;
		} else {
			toast.error(t('users.groups.addUser.loadError'));
			availableUsers = [];
		}
	}

	function closeUserDialog() {
		userDialogOpen = false;
		selectedUserId = '';
		availableUsers = [];
		userComboboxOpen = false;
	}

	function closeAndFocusUserTrigger() {
		userComboboxOpen = false;
		tick().then(() => {
			document.getElementById(userTriggerId)?.focus();
		});
	}

	async function handleAddUser() {
		if (!selectedUserId) return;
		addingUser = true;
		try {
			const result = await addUserToGroup({ userId: parseInt(selectedUserId), groupId });
			if (result.success) {
				toast.success(t('users.groups.addUser.success'));
				closeUserDialog();
				await loadUsers();
			} else {
				toast.error(result.error || t('users.groups.addUser.error'));
			}
		} catch (err) {
			console.error('Failed to add user to group:', err);
			toast.error(t('users.groups.addUser.error'));
		} finally {
			addingUser = false;
		}
	}

	// --- Jogosultság műveletek ---

	function handleOpenPermission(permission: GroupPermissionRow) {
		shell.navigateTo(
			'PermissionDetail',
			{
				permissionId: permission.id,
				returnTo: 'GroupDetail',
				groupId
			},
			'#groups'
		);
	}

	function handleRemovePermission(permission: GroupPermissionRow) {
		permissionToRemove = permission;
		removePermDialogOpen = true;
	}

	function cancelRemovePermission() {
		removePermDialogOpen = false;
		permissionToRemove = null;
	}

	async function confirmRemovePermission() {
		if (!permissionToRemove) return;
		try {
			const result = await removePermissionFromGroup({
				permissionId: permissionToRemove.id,
				groupId
			});
			if (result.success) {
				toast.success(t('users.groups.removePermission.success'));
				removePermDialogOpen = false;
				permissionToRemove = null;
				await loadPermissions();
			} else {
				toast.error(result.error || t('users.groups.removePermission.error'));
			}
		} catch (err) {
			console.error('Failed to remove permission from group:', err);
			toast.error(t('users.groups.removePermission.error'));
		}
	}

	async function openAddPermissionDialog() {
		permDialogOpen = true;
		selectedPermissionId = '';
		permComboboxOpen = false;
		const result = await fetchAvailablePermissionsForGroup({ groupId });
		if (result.success) {
			availablePermissions = result.data;
		} else {
			toast.error(t('users.groups.addPermission.loadError'));
			availablePermissions = [];
		}
	}

	function closePermDialog() {
		permDialogOpen = false;
		selectedPermissionId = '';
		availablePermissions = [];
		permComboboxOpen = false;
	}

	function closeAndFocusPermTrigger() {
		permComboboxOpen = false;
		tick().then(() => {
			document.getElementById(permTriggerId)?.focus();
		});
	}

	async function handleAddPermission() {
		if (!selectedPermissionId) return;
		addingPermission = true;
		try {
			const result = await addPermissionToGroup({
				permissionId: parseInt(selectedPermissionId),
				groupId
			});
			if (result.success) {
				toast.success(t('users.groups.addPermission.success'));
				closePermDialog();
				await loadPermissions();
			} else {
				toast.error(result.error || t('users.groups.addPermission.error'));
			}
		} catch (err) {
			console.error('Failed to add permission to group:', err);
			toast.error(t('users.groups.addPermission.error'));
		} finally {
			addingPermission = false;
		}
	}

	// --- App műveletek ---

	async function handleOpenApp(app: GroupAppRow) {
		try {
			const appMetadata = await getAppByName(app.appId);
			if (appMetadata) {
				windowManager.openWindow(appMetadata.appName, appMetadata.title, appMetadata);
			} else {
				toast.error(t('users.groups.openApp.error'));
			}
		} catch (err) {
			console.error('Failed to open app:', err);
			toast.error(t('users.groups.openApp.error'));
		}
	}

	function handleRemoveApp(app: GroupAppRow) {
		appToRemove = app;
		removeAppDialogOpen = true;
	}

	function cancelRemoveApp() {
		removeAppDialogOpen = false;
		appToRemove = null;
	}

	async function confirmRemoveApp() {
		if (!appToRemove) return;
		try {
			const result = await removeAppFromGroup({ appId: appToRemove.id, groupId });
			if (result.success) {
				toast.success(t('users.groups.removeApp.success'));
				removeAppDialogOpen = false;
				appToRemove = null;
				await loadApps();
			} else {
				toast.error(result.error || t('users.groups.removeApp.error'));
			}
		} catch (err) {
			console.error('Failed to remove app from group:', err);
			toast.error(t('users.groups.removeApp.error'));
		}
	}

	async function openAddAppDialog() {
		appDialogOpen = true;
		selectedAppId = '';
		appComboboxOpen = false;
		const result = await fetchAvailableAppsForGroup({ groupId });
		if (result.success) {
			availableApps = result.data;
		} else {
			toast.error(t('users.groups.addApp.loadError'));
			availableApps = [];
		}
	}

	function closeAppDialog() {
		appDialogOpen = false;
		selectedAppId = '';
		availableApps = [];
		appComboboxOpen = false;
	}

	function closeAndFocusAppTrigger() {
		appComboboxOpen = false;
		tick().then(() => {
			document.getElementById(appTriggerId)?.focus();
		});
	}

	async function handleAddApp() {
		if (!selectedAppId) return;
		addingApp = true;
		try {
			const result = await addAppToGroup({ appId: parseInt(selectedAppId), groupId });
			if (result.success) {
				toast.success(t('users.groups.addApp.success'));
				closeAppDialog();
				await loadApps();
			} else {
				toast.error(result.error || t('users.groups.addApp.error'));
			}
		} catch (err) {
			console.error('Failed to add app to group:', err);
			toast.error(t('users.groups.addApp.error'));
		} finally {
			addingApp = false;
		}
	}

	// --- Adatbetöltés ---

	async function loadData() {
		const id = groupId;
		if (id == null || id <= 0) return;
		loading = true;
		error = null;
		try {
			const result = await fetchGroup({ groupId: id });
			if (result.success) {
				group = result.data.group;
				if (!editing) {
					actionBar.set(actionBarContent);
				}
			} else {
				error = result.error || t('users.groups.detail.error');
			}
		} catch (err) {
			console.error('Failed to load group:', err);
			error = t('users.groups.detail.error');
		} finally {
			loading = false;
		}
	}

	// --- Felhasználó tábla szerver-oldali lapozás ---

	let users = $state<UserSelectModel[]>([]);
	let userLoading = $state(false);
	let userPaginationInfo = $state<PaginationInfo>({
		page: 1,
		pageSize: 10,
		totalCount: 0,
		totalPages: 0
	});
	let userTableState = $state<DataTableState>({
		page: 1,
		pageSize: 10,
		sortBy: 'name',
		sortOrder: 'asc'
	});

	async function loadUsers() {
		if (!groupId || groupId <= 0) return;
		userLoading = true;
		try {
			const result = await fetchGroupUsers({
				groupId,
				page: userTableState.page,
				pageSize: userTableState.pageSize,
				sortBy: userTableState.sortBy,
				sortOrder: userTableState.sortOrder
			});
			if (result.success) {
				users = result.data;
				userPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load group users:', err);
		} finally {
			userLoading = false;
		}
	}

	function handleUserStateChange(state: DataTableState) {
		userTableState = state;
	}

	// --- Jogosultság tábla szerver-oldali lapozás ---

	let groupPerms = $state<GroupPermissionRow[]>([]);
	let permLoading = $state(false);
	let permPaginationInfo = $state<PaginationInfo>({
		page: 1,
		pageSize: 10,
		totalCount: 0,
		totalPages: 0
	});
	let permTableState = $state<DataTableState>({
		page: 1,
		pageSize: 10,
		sortBy: 'name',
		sortOrder: 'asc'
	});

	async function loadPermissions() {
		if (!groupId || groupId <= 0) return;
		permLoading = true;
		try {
			const result = await fetchGroupPermissions({
				groupId,
				page: permTableState.page,
				pageSize: permTableState.pageSize,
				sortBy: permTableState.sortBy,
				sortOrder: permTableState.sortOrder
			});
			if (result.success) {
				groupPerms = result.data;
				permPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load group permissions:', err);
		} finally {
			permLoading = false;
		}
	}

	function handlePermStateChange(state: DataTableState) {
		permTableState = state;
	}

	// --- App tábla szerver-oldali lapozás ---

	let groupApps = $state<GroupAppRow[]>([]);
	let appLoading = $state(false);
	let appPaginationInfo = $state<PaginationInfo>({
		page: 1,
		pageSize: 10,
		totalCount: 0,
		totalPages: 0
	});
	let appTableState = $state<DataTableState>({
		page: 1,
		pageSize: 10,
		sortBy: 'name',
		sortOrder: 'asc'
	});

	async function loadApps() {
		if (!groupId || groupId <= 0) return;
		appLoading = true;
		try {
			const result = await fetchGroupApps({
				groupId,
				page: appTableState.page,
				pageSize: appTableState.pageSize,
				sortBy: appTableState.sortBy,
				sortOrder: appTableState.sortOrder
			});
			if (result.success) {
				groupApps = result.data;
				appPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load group apps:', err);
		} finally {
			appLoading = false;
		}
	}

	function handleAppStateChange(state: DataTableState) {
		appTableState = state;
	}

	$effect(() => {
		groupId;
		untrack(() => loadData());
	});

	$effect(() => {
		userTableState;
		untrack(() => loadUsers());
	});

	$effect(() => {
		permTableState;
		untrack(() => loadPermissions());
	});

	$effect(() => {
		appTableState;
		untrack(() => loadApps());
	});

	$effect(() => {
		return () => {
			actionBar.clear();
		};
	});

	// --- Táblázatok ---

	let userDataTable = $state<DataTable<UserSelectModel>>();
	const userColumns = $derived(
		createUserColumns({
			t,
			onSort: (id, desc) => userDataTable?.handleSort(id, desc),
			onOpenUser: handleOpenUser,
			onRemoveFromGroup: handleRemoveUser
		})
	);

	let permDataTable = $state<DataTable<GroupPermissionRow>>();
	const permColumns = $derived(
		createPermissionColumns({
			t,
			onSort: (id, desc) => permDataTable?.handleSort(id, desc),
			onOpenPermission: handleOpenPermission,
			onRemoveFromGroup: handleRemovePermission
		})
	);

	let appDataTable = $state<DataTable<GroupAppRow>>();
	const appColumns = $derived(
		createAppColumns({
			t,
			onSort: (id, desc) => appDataTable?.handleSort(id, desc),
			onOpenApp: handleOpenApp,
			onRemoveFromGroup: handleRemoveApp
		})
	);

	const groupName = $derived(
		group?.name ? (typeof group.name === 'object' ? group.name[locale] || '' : '') : ''
	);
	const groupDescription = $derived(
		group?.description
			? typeof group.description === 'object'
				? group.description[locale] || ''
				: ''
			: ''
	);

	const selectedUser = $derived(availableUsers.find((u) => u.id.toString() === selectedUserId));
	const selectedPermission = $derived(
		availablePermissions.find((p) => p.id.toString() === selectedPermissionId)
	);
	const selectedApp = $derived(availableApps.find((a) => a.id.toString() === selectedAppId));
</script>

{#snippet actionBarContent()}
	<div class="flex gap-2">
		<ButtonEdit text={t('common.buttons.edit')} onclick={startEditing} />
		{#if activeTab === 'permissions'}
			<Button variant="default" size="sm" onclick={openAddPermissionDialog}>
				<ShieldPlus class="mr-2 size-4" />
				{t('users.groups.addPermission.button')}
			</Button>
		{:else if activeTab === 'apps'}
			<Button variant="default" size="sm" onclick={openAddAppDialog}>
				<AppWindow class="mr-2 size-4" />
				{t('users.groups.addApp.button')}
			</Button>
		{:else}
			<Button variant="default" size="sm" onclick={openAddUserDialog}>
				<UserPlus class="mr-2 size-4" />
				{t('users.groups.addUser.button')}
			</Button>
		{/if}
		<Button variant="destructive" size="sm" onclick={handleDelete}>
			<Trash2 class="mr-2 size-4" />
			{t('users.groups.delete.button')}
		</Button>
	</div>
{/snippet}

{#snippet editingActions()}
	<ButtonCancel text={t('common.buttons.cancel')} onclick={cancelEditing} />
	<ButtonSave text={t('common.buttons.save')} onclick={handleSave} />
{/snippet}

<div class="title-block">
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" class="size-8" onclick={handleBack}>
			<ArrowLeft class="size-4" />
			<span class="sr-only">{t('common.buttons.back')}</span>
		</Button>
		<h2>{t('users.groups.detail.title')}</h2>
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
{:else if group}
	<div class="space-y-6">
		<div class="space-y-4">
			<div>
				<div class="text-muted-foreground text-sm font-medium">{t('users.groups.detail.name')}</div>
				{#if editing}
					<Input bind:value={formName} />
				{:else}
					<p class="text-base">{groupName}</p>
				{/if}
			</div>
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('users.groups.detail.description')}
				</div>
				{#if editing}
					<Input bind:value={formDescription} />
				{:else if groupDescription}
					<p class="text-base">{groupDescription}</p>
				{:else}
					<p class="text-muted-foreground text-base">—</p>
				{/if}
			</div>
		</div>

		<Tabs.Root bind:value={activeTab}>
			<Tabs.List>
				<Tabs.Trigger value="members">{t('users.groups.detail.members')}</Tabs.Trigger>
				<Tabs.Trigger value="permissions">{t('users.groups.detail.permissions')}</Tabs.Trigger>
				<Tabs.Trigger value="apps">{t('users.groups.detail.apps')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="members">
				<DataTable
					bind:this={userDataTable}
					columns={userColumns}
					data={users}
					pagination={userPaginationInfo}
					loading={userLoading}
					striped
					initialSortBy="name"
					initialSortOrder="asc"
					initialPageSize={10}
					onStateChange={handleUserStateChange}
				/>
			</Tabs.Content>
			<Tabs.Content value="permissions">
				<DataTable
					bind:this={permDataTable}
					columns={permColumns}
					data={groupPerms}
					pagination={permPaginationInfo}
					loading={permLoading}
					striped
					initialSortBy="name"
					initialSortOrder="asc"
					initialPageSize={10}
					onStateChange={handlePermStateChange}
				/>
			</Tabs.Content>
			<Tabs.Content value="apps">
				<DataTable
					bind:this={appDataTable}
					columns={appColumns}
					data={groupApps}
					pagination={appPaginationInfo}
					loading={appLoading}
					striped
					initialSortBy="name"
					initialSortOrder="asc"
					initialPageSize={10}
					onStateChange={handleAppStateChange}
				/>
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/if}

<!-- Felhasználó hozzáadása dialog -->
<CustomDialog
	bind:open={userDialogOpen}
	title={t('users.groups.addUser.title')}
	onClose={closeUserDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.groups.addUser.description')}</p>
			<div class="space-y-2">
				<label for="user-select" class="text-sm font-medium"
					>{t('users.groups.addUser.selectLabel')}</label
				>
				<Popover.Root bind:open={userComboboxOpen}>
					<Popover.Trigger
						id={userTriggerId}
						class="border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if selectedUser}
							<span class="truncate">{selectedUser.name} ({selectedUser.email})</span>
						{:else}
							<span class="text-muted-foreground"
								>{t('users.groups.addUser.selectPlaceholder')}</span
							>
						{/if}
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content
						class="z-10001 w-(--bits-popover-trigger-width) p-0"
						align="start"
						portalProps={{ to: 'body' }}
					>
						<Command.Root
							filter={(value, search) => {
								return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
							}}
						>
							<Command.Input placeholder={t('users.groups.addUser.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.groups.addUser.noResults')}</Command.Empty>
								<Command.Group>
									{#each availableUsers as user (user.id)}
										<Command.Item
											value={`${user.name} ${user.email}`}
											onSelect={() => {
												selectedUserId = user.id.toString();
												closeAndFocusUserTrigger();
											}}
										>
											<Check
												class={cn(
													'mr-2 size-4',
													selectedUserId !== user.id.toString() && 'text-transparent'
												)}
											/>
											<div class="flex flex-col">
												<span>{user.name}</span>
												<span class="text-muted-foreground text-xs">{user.email}</span>
											</div>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={closeUserDialog} disabled={addingUser}
			>{t('common.buttons.cancel')}</Button
		>
		<Button onclick={handleAddUser} disabled={!selectedUserId || addingUser}>
			{addingUser ? t('common.loading') : t('users.groups.addUser.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- Jogosultság hozzáadása dialog -->
<CustomDialog
	bind:open={permDialogOpen}
	title={t('users.groups.addPermission.title')}
	onClose={closePermDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.groups.addPermission.description')}</p>
			<div class="space-y-2">
				<label for="permission-select" class="text-sm font-medium"
					>{t('users.groups.addPermission.selectLabel')}</label
				>
				<Popover.Root bind:open={permComboboxOpen}>
					<Popover.Trigger
						id={permTriggerId}
						class="border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if selectedPermission}
							<span class="truncate">{selectedPermission.name}</span>
						{:else}
							<span class="text-muted-foreground"
								>{t('users.groups.addPermission.selectPlaceholder')}</span
							>
						{/if}
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content
						class="z-10001 w-(--bits-popover-trigger-width) p-0"
						align="start"
						portalProps={{ to: 'body' }}
					>
						<Command.Root
							filter={(value, search) => {
								return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
							}}
						>
							<Command.Input placeholder={t('users.groups.addPermission.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.groups.addPermission.noResults')}</Command.Empty>
								<Command.Group>
									{#each availablePermissions as permission (permission.id)}
										<Command.Item
											value={`${permission.name} ${permission.description ?? ''}`}
											onSelect={() => {
												selectedPermissionId = permission.id.toString();
												closeAndFocusPermTrigger();
											}}
										>
											<Check
												class={cn(
													'mr-2 size-4',
													selectedPermissionId !== permission.id.toString() && 'text-transparent'
												)}
											/>
											<div class="flex flex-col">
												<span>{permission.name}</span>
												{#if permission.description}
													<span class="text-muted-foreground text-xs">{permission.description}</span
													>
												{/if}
											</div>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={closePermDialog} disabled={addingPermission}
			>{t('common.buttons.cancel')}</Button
		>
		<Button onclick={handleAddPermission} disabled={!selectedPermissionId || addingPermission}>
			{addingPermission ? t('common.loading') : t('users.groups.addPermission.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- Felhasználó eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removeUserDialogOpen}
	title={t('users.groups.removeUser.title')}
	description={userToRemove
		? t('users.groups.removeUser.description', {
				name: userToRemove.name,
				email: userToRemove.email
			})
		: ''}
	confirmText={t('users.groups.removeUser.confirm')}
	cancelText={t('users.groups.removeUser.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemoveUser}
	onCancel={cancelRemoveUser}
/>

<!-- Jogosultság eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removePermDialogOpen}
	title={t('users.groups.removePermission.title')}
	description={permissionToRemove
		? t('users.groups.removePermission.description', { name: permissionToRemove.name })
		: ''}
	confirmText={t('users.groups.removePermission.confirm')}
	cancelText={t('users.groups.removePermission.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemovePermission}
	onCancel={cancelRemovePermission}
/>

<!-- Csoport törlése megerősítő dialog -->
<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('users.groups.delete.title')}
	description={group
		? t('users.groups.delete.description', {
				name: groupName
			})
		: ''}
	confirmText={t('users.groups.delete.confirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>

<!-- App hozzáadása dialog -->
<CustomDialog
	bind:open={appDialogOpen}
	title={t('users.groups.addApp.title')}
	onClose={closeAppDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.groups.addApp.description')}</p>
			<div class="space-y-2">
				<label for="app-select" class="text-sm font-medium"
					>{t('users.groups.addApp.selectLabel')}</label
				>
				<Popover.Root bind:open={appComboboxOpen}>
					<Popover.Trigger
						id={appTriggerId}
						class="border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if selectedApp}
							<span class="truncate"
								>{(() => {
									const nameObj = selectedApp.name as any;
									return typeof nameObj === 'object' && nameObj !== null
										? nameObj.hu || nameObj.en
										: nameObj;
								})()}</span
							>
						{:else}
							<span class="text-muted-foreground">{t('users.groups.addApp.selectPlaceholder')}</span
							>
						{/if}
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Popover.Trigger>
					<Popover.Content
						class="z-10001 w-(--bits-popover-trigger-width) p-0"
						align="start"
						portalProps={{ to: 'body' }}
					>
						<Command.Root
							filter={(value, search) => {
								return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
							}}
						>
							<Command.Input placeholder={t('users.groups.addApp.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.groups.addApp.noResults')}</Command.Empty>
								<Command.Group>
									{#each availableApps as app (app.id)}
										{@const nameObj = app.name as any}
										{@const appName =
											typeof nameObj === 'object' && nameObj !== null
												? nameObj.hu || nameObj.en
												: nameObj}
										<Command.Item
											value={`${appName}`}
											onSelect={() => {
												selectedAppId = app.id.toString();
												closeAndFocusAppTrigger();
											}}
										>
											<Check
												class={cn(
													'mr-2 size-4',
													selectedAppId !== app.id.toString() && 'text-transparent'
												)}
											/>
											<div class="flex items-center gap-2">
												<img src={app.icon} alt="" class="size-6" />
												<span>{appName}</span>
											</div>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={closeAppDialog} disabled={addingApp}
			>{t('common.buttons.cancel')}</Button
		>
		<Button onclick={handleAddApp} disabled={!selectedAppId || addingApp}>
			{addingApp ? t('common.loading') : t('users.groups.addApp.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- App eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removeAppDialogOpen}
	title={t('users.groups.removeApp.title')}
	description={appToRemove
		? t('users.groups.removeApp.description', {
				name: (() => {
					const nameObj = appToRemove.name as any;
					return typeof nameObj === 'object' && nameObj !== null
						? nameObj.hu || nameObj.en
						: nameObj;
				})()
			})
		: ''}
	confirmText={t('users.groups.removeApp.confirm')}
	cancelText={t('users.groups.removeApp.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemoveApp}
	onCancel={cancelRemoveApp}
/>
