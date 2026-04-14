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
	import ShieldPlus from 'lucide-svelte/icons/shield-plus';
	import UserPlus from 'lucide-svelte/icons/user-plus';
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
		fetchRole,
		fetchRolePermissions,
		fetchRoleUsers,
		fetchRoleApps,
		updateRole,
		deleteRole,
		addPermissionToRole,
		fetchAvailablePermissions,
		removePermissionFromRole,
		fetchAvailableUsersForRole,
		addUserToRole,
		removeUserFromRole,
		fetchAvailableAppsForRole,
		addAppToRole,
		removeAppFromRole
	} from '../roles.remote';
	import type { RoleSelectModel, UserSelectModel } from '@racona/database/schemas';
	import type { RolePermissionRow, RoleAppRow } from '$lib/server/database/repositories';
	import type { DataTableState } from '$lib/components/ui/data-table';
	import { createColumns as createPermissionColumns } from './roleDetailPermissionColumns';
	import { createColumns as createUserColumns } from './roleDetailUserColumns';
	import { createColumns as createAppColumns } from './roleDetailAppColumns';
	import { toast } from 'svelte-sonner';

	interface Props {
		roleId: number;
	}

	let { roleId }: Props = $props();

	const shell = getAppShell();
	const actionBar = getActionBar();
	const { t, locale } = useI18n();
	const windowManager = getWindowManager();

	let role = $state<RoleSelectModel | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let activeTab = $state('members');
	let editing = $state(false);

	// Szerkesztési form state
	let formName = $state('');
	let formDescription = $state('');

	// Jogosultság hozzáadás dialog állapot
	let permDialogOpen = $state(false);
	let permComboboxOpen = $state(false);
	let availablePermissions = $state<RolePermissionRow[]>([]);
	let selectedPermissionId = $state<string>('');
	let addingPermission = $state(false);

	// Jogosultság eltávolítás dialog állapot
	let removePermDialogOpen = $state(false);
	let permissionToRemove = $state<RolePermissionRow | null>(null);

	// Felhasználó hozzáadás dialog állapot
	let userDialogOpen = $state(false);
	let userComboboxOpen = $state(false);
	let availableUsers = $state<UserSelectModel[]>([]);
	let selectedUserId = $state<string>('');
	let addingUser = $state(false);

	// Felhasználó eltávolítás dialog állapot
	let removeUserDialogOpen = $state(false);
	let userToRemove = $state<UserSelectModel | null>(null);

	// App hozzáadás dialog állapot
	let appDialogOpen = $state(false);
	let appComboboxOpen = $state(false);
	let availableApps = $state<RoleAppRow[]>([]);
	let selectedAppId = $state<string>('');
	let addingApp = $state(false);

	// App eltávolítás dialog állapot
	let removeAppDialogOpen = $state(false);
	let appToRemove = $state<RoleAppRow | null>(null);

	const permTriggerId = useId();
	const userTriggerId = useId();
	const appTriggerId = useId();

	function handleBack() {
		actionBar.clear();
		shell.navigateTo('RoleList');
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
		if (!role) return;
		try {
			const result = await deleteRole({ roleId: role.id });
			if (result.success) {
				toast.success(t('users.roles.delete.success'));
				deleteDialogOpen = false;
				actionBar.clear();
				shell.navigateTo('RoleList');
			} else {
				toast.error(result.error || t('users.roles.delete.error'));
			}
		} catch (err) {
			console.error('Failed to delete role:', err);
			toast.error(t('users.roles.delete.error'));
		}
	}

	// --- Szerkesztés ---

	function resolveText(value: unknown, loc: string): string {
		if (!value || typeof value !== 'object') return '';
		const obj = value as Record<string, string>;
		return obj[loc] || obj['en'] || Object.values(obj)[0] || '';
	}

	function startEditing() {
		if (!role) return;
		formName = resolveText(role.name, locale);
		formDescription = resolveText(role.description, locale);
		editing = true;
		actionBar.set(editingActions);
	}

	function cancelEditing() {
		editing = false;
		actionBar.set(actionBarContent);
	}

	async function handleSave() {
		if (!role || !formName.trim()) return;
		try {
			const result = await updateRole({
				roleId: role.id,
				name: formName.trim(),
				description: formDescription.trim() || undefined,
				locale
			});
			if (result.success) {
				toast.success(t('users.roles.edit.saveSuccess'));
				editing = false;
				await loadData();
			} else {
				toast.error(result.error || t('users.roles.edit.saveError'));
			}
		} catch (err) {
			console.error('Failed to update role:', err);
			toast.error(t('users.roles.edit.saveError'));
		}
	}

	// --- Jogosultság műveletek ---

	function handleOpenPermission(permission: RolePermissionRow) {
		shell.navigateTo(
			'PermissionDetail',
			{
				permissionId: permission.id,
				returnTo: 'RoleDetail',
				roleId
			},
			'#roles'
		);
	}

	function handleRemovePermission(permission: RolePermissionRow) {
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
			const result = await removePermissionFromRole({
				permissionId: permissionToRemove.id,
				roleId
			});
			if (result.success) {
				toast.success(t('users.roles.removePermission.success'));
				removePermDialogOpen = false;
				permissionToRemove = null;
				await loadPermissions();
			} else {
				toast.error(result.error || t('users.roles.removePermission.error'));
			}
		} catch (err) {
			console.error('Failed to remove permission from role:', err);
			toast.error(t('users.roles.removePermission.error'));
		}
	}

	async function openAddPermissionDialog() {
		permDialogOpen = true;
		selectedPermissionId = '';
		permComboboxOpen = false;
		const result = await fetchAvailablePermissions({ roleId });
		if (result.success) {
			availablePermissions = result.data;
		} else {
			toast.error(t('users.roles.addPermission.loadError'));
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
			const result = await addPermissionToRole({
				permissionId: parseInt(selectedPermissionId),
				roleId
			});
			if (result.success) {
				toast.success(t('users.roles.addPermission.success'));
				closePermDialog();
				await loadPermissions();
			} else {
				toast.error(result.error || t('users.roles.addPermission.error'));
			}
		} catch (err) {
			console.error('Failed to add permission to role:', err);
			toast.error(t('users.roles.addPermission.error'));
		} finally {
			addingPermission = false;
		}
	}

	// --- Felhasználó műveletek ---

	function handleOpenUser(user: UserSelectModel) {
		shell.navigateTo('UserDetail', { userId: user.id, returnTo: 'RoleDetail', roleId }, '#roles');
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
			const result = await removeUserFromRole({ userId: userToRemove.id, roleId });
			if (result.success) {
				toast.success(t('users.roles.removeUser.success'));
				removeUserDialogOpen = false;
				userToRemove = null;
				await loadUsers();
			} else {
				toast.error(result.error || t('users.roles.removeUser.error'));
			}
		} catch (err) {
			console.error('Failed to remove user from role:', err);
			toast.error(t('users.roles.removeUser.error'));
		}
	}

	async function openAddUserDialog() {
		userDialogOpen = true;
		selectedUserId = '';
		userComboboxOpen = false;
		const result = await fetchAvailableUsersForRole({ roleId });
		if (result.success) {
			availableUsers = result.data;
		} else {
			toast.error(t('users.roles.addUser.loadError'));
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
			const result = await addUserToRole({ userId: parseInt(selectedUserId), roleId });
			if (result.success) {
				toast.success(t('users.roles.addUser.success'));
				closeUserDialog();
				await loadUsers();
			} else {
				toast.error(result.error || t('users.roles.addUser.error'));
			}
		} catch (err) {
			console.error('Failed to add user to role:', err);
			toast.error(t('users.roles.addUser.error'));
		} finally {
			addingUser = false;
		}
	}

	// --- App műveletek ---

	async function handleOpenApp(app: RoleAppRow) {
		try {
			const appMetadata = await getAppByName(app.appId);
			if (appMetadata) {
				windowManager.openWindow(appMetadata.appName, appMetadata.title, appMetadata);
			} else {
				toast.error(t('users.roles.openApp.error'));
			}
		} catch (err) {
			console.error('Failed to open app:', err);
			toast.error(t('users.roles.openApp.error'));
		}
	}

	function handleRemoveApp(app: RoleAppRow) {
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
			const result = await removeAppFromRole({ appId: appToRemove.id, roleId });
			if (result.success) {
				toast.success(t('users.roles.removeApp.success'));
				removeAppDialogOpen = false;
				appToRemove = null;
				await loadApps();
			} else {
				toast.error(result.error || t('users.roles.removeApp.error'));
			}
		} catch (err) {
			console.error('Failed to remove app from role:', err);
			toast.error(t('users.roles.removeApp.error'));
		}
	}

	async function openAddAppDialog() {
		appDialogOpen = true;
		selectedAppId = '';
		appComboboxOpen = false;
		const result = await fetchAvailableAppsForRole({ roleId });
		if (result.success) {
			availableApps = result.data;
		} else {
			toast.error(t('users.roles.addApp.loadError'));
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
			const result = await addAppToRole({ appId: parseInt(selectedAppId), roleId });
			if (result.success) {
				toast.success(t('users.roles.addApp.success'));
				closeAppDialog();
				await loadApps();
			} else {
				toast.error(result.error || t('users.roles.addApp.error'));
			}
		} catch (err) {
			console.error('Failed to add app to role:', err);
			toast.error(t('users.roles.addApp.error'));
		} finally {
			addingApp = false;
		}
	}

	// --- Adatbetöltés ---

	async function loadData() {
		const id = roleId;
		if (id == null || id <= 0) return;
		loading = true;
		error = null;
		try {
			const result = await fetchRole({ roleId: id });
			if (result.success) {
				role = result.data.role;
				if (!editing) {
					actionBar.set(actionBarContent);
				}
			} else {
				error = result.error || t('users.roles.detail.error');
			}
		} catch (err) {
			console.error('Failed to load role:', err);
			error = t('users.roles.detail.error');
		} finally {
			loading = false;
		}
	}

	// --- Jogosultság tábla szerver-oldali lapozás ---

	let perms = $state<RolePermissionRow[]>([]);
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
		permLoading = true;
		try {
			const result = await fetchRolePermissions({
				roleId,
				page: permTableState.page,
				pageSize: permTableState.pageSize,
				sortBy: permTableState.sortBy,
				sortOrder: permTableState.sortOrder
			});
			if (result.success) {
				perms = result.data;
				permPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load role permissions:', err);
		} finally {
			permLoading = false;
		}
	}

	function handlePermStateChange(state: DataTableState) {
		permTableState = state;
	}

	// --- Felhasználó tábla szerver-oldali lapozás ---

	let roleUsers = $state<UserSelectModel[]>([]);
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
		userLoading = true;
		try {
			const result = await fetchRoleUsers({
				roleId,
				page: userTableState.page,
				pageSize: userTableState.pageSize,
				sortBy: userTableState.sortBy,
				sortOrder: userTableState.sortOrder
			});
			if (result.success) {
				roleUsers = result.data;
				userPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load role users:', err);
		} finally {
			userLoading = false;
		}
	}

	function handleUserStateChange(state: DataTableState) {
		userTableState = state;
	}

	// --- App tábla szerver-oldali lapozás ---

	let roleApps = $state<RoleAppRow[]>([]);
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
		appLoading = true;
		try {
			const result = await fetchRoleApps({
				roleId,
				page: appTableState.page,
				pageSize: appTableState.pageSize,
				sortBy: appTableState.sortBy,
				sortOrder: appTableState.sortOrder
			});
			if (result.success) {
				roleApps = result.data;
				appPaginationInfo = result.pagination;
			}
		} catch (err) {
			console.error('Failed to load role apps:', err);
		} finally {
			appLoading = false;
		}
	}

	function handleAppStateChange(state: DataTableState) {
		appTableState = state;
	}

	$effect(() => {
		roleId;
		untrack(() => loadData());
	});

	$effect(() => {
		permTableState;
		untrack(() => loadPermissions());
	});

	$effect(() => {
		userTableState;
		untrack(() => loadUsers());
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

	let permDataTable = $state<DataTable<RolePermissionRow>>();
	const permColumns = $derived(
		createPermissionColumns({
			t,
			onSort: (id, desc) => permDataTable?.handleSort(id, desc),
			onOpenPermission: handleOpenPermission,
			onRemoveFromRole: handleRemovePermission
		})
	);

	let userDataTable = $state<DataTable<UserSelectModel>>();
	const userColumns = $derived(
		createUserColumns({
			t,
			onSort: (id, desc) => userDataTable?.handleSort(id, desc),
			onOpenUser: handleOpenUser,
			onRemoveFromRole: handleRemoveUser
		})
	);

	let appDataTable = $state<DataTable<RoleAppRow>>();
	const appColumns = $derived(
		createAppColumns({
			t,
			onSort: (id, desc) => appDataTable?.handleSort(id, desc),
			onOpenApp: handleOpenApp,
			onRemoveFromRole: handleRemoveApp
		})
	);

	const selectedPermission = $derived(
		availablePermissions.find((p) => p.id.toString() === selectedPermissionId)
	);
	const selectedUser = $derived(availableUsers.find((u) => u.id.toString() === selectedUserId));
	const selectedApp = $derived(availableApps.find((a) => a.id.toString() === selectedAppId));

	const roleName = $derived(
		role?.name ? (typeof role.name === 'object' ? role.name[locale] || '' : String(role.name)) : ''
	);
	const roleDescription = $derived(
		role?.description
			? typeof role.description === 'object'
				? role.description[locale] || ''
				: String(role.description)
			: ''
	);
</script>

{#snippet actionBarContent()}
	<div class="flex gap-2">
		<ButtonEdit text={t('common.buttons.edit')} onclick={startEditing} />
		{#if activeTab === 'permissions'}
			<Button variant="default" size="sm" onclick={openAddPermissionDialog}>
				<ShieldPlus class="mr-2 size-4" />
				{t('users.roles.addPermission.button')}
			</Button>
		{:else if activeTab === 'apps'}
			<Button variant="default" size="sm" onclick={openAddAppDialog}>
				<AppWindow class="mr-2 size-4" />
				{t('users.roles.addApp.button')}
			</Button>
		{:else}
			<Button variant="default" size="sm" onclick={openAddUserDialog}>
				<UserPlus class="mr-2 size-4" />
				{t('users.roles.addUser.button')}
			</Button>
		{/if}
		<Button variant="destructive" size="sm" onclick={handleDelete}>
			<Trash2 class="mr-2 size-4" />
			{t('users.roles.delete.button')}
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
		<h2>{t('users.roles.detail.title')}</h2>
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
{:else if role}
	<div class="space-y-6">
		<div class="space-y-4">
			<div>
				<div class="text-muted-foreground text-sm font-medium">{t('users.roles.detail.name')}</div>
				{#if editing}
					<Input bind:value={formName} />
				{:else}
					<p class="text-base">{roleName}</p>
				{/if}
			</div>
			<div>
				<div class="text-muted-foreground text-sm font-medium">
					{t('users.roles.detail.description')}
				</div>
				{#if editing}
					<Input bind:value={formDescription} />
				{:else if roleDescription}
					<p class="text-base">{roleDescription}</p>
				{:else}
					<p class="text-muted-foreground text-base">—</p>
				{/if}
			</div>
		</div>

		<Tabs.Root bind:value={activeTab}>
			<Tabs.List>
				<Tabs.Trigger value="members">{t('users.roles.detail.members')}</Tabs.Trigger>
				<Tabs.Trigger value="permissions">{t('users.roles.detail.permissions')}</Tabs.Trigger>
				<Tabs.Trigger value="apps">{t('users.roles.detail.apps')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="members">
				<DataTable
					bind:this={userDataTable}
					columns={userColumns}
					data={roleUsers}
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
					data={perms}
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
					data={roleApps}
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

<!-- Jogosultság hozzáadása dialog -->
<CustomDialog
	bind:open={permDialogOpen}
	title={t('users.roles.addPermission.title')}
	onClose={closePermDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.roles.addPermission.description')}</p>
			<div class="space-y-2">
				<label for="permission-select" class="text-sm font-medium"
					>{t('users.roles.addPermission.selectLabel')}</label
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
								>{t('users.roles.addPermission.selectPlaceholder')}</span
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
							<Command.Input placeholder={t('users.roles.addPermission.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.roles.addPermission.noResults')}</Command.Empty>
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
			{addingPermission ? t('common.loading') : t('users.roles.addPermission.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- Felhasználó hozzáadása dialog -->
<CustomDialog
	bind:open={userDialogOpen}
	title={t('users.roles.addUser.title')}
	onClose={closeUserDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.roles.addUser.description')}</p>
			<div class="space-y-2">
				<label for="user-select" class="text-sm font-medium"
					>{t('users.roles.addUser.selectLabel')}</label
				>
				<Popover.Root bind:open={userComboboxOpen}>
					<Popover.Trigger
						id={userTriggerId}
						class="border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if selectedUser}
							<span class="truncate">{selectedUser.name} ({selectedUser.email})</span>
						{:else}
							<span class="text-muted-foreground">{t('users.roles.addUser.selectPlaceholder')}</span
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
							<Command.Input placeholder={t('users.roles.addUser.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.roles.addUser.noResults')}</Command.Empty>
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
			{addingUser ? t('common.loading') : t('users.roles.addUser.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- Jogosultság eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removePermDialogOpen}
	title={t('users.roles.removePermission.title')}
	description={permissionToRemove
		? t('users.roles.removePermission.description', { name: permissionToRemove.name })
		: ''}
	confirmText={t('users.roles.removePermission.confirm')}
	cancelText={t('users.roles.removePermission.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemovePermission}
	onCancel={cancelRemovePermission}
/>

<!-- Felhasználó eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removeUserDialogOpen}
	title={t('users.roles.removeUser.title')}
	description={userToRemove
		? t('users.roles.removeUser.description', {
				name: userToRemove.name,
				email: userToRemove.email
			})
		: ''}
	confirmText={t('users.roles.removeUser.confirm')}
	cancelText={t('users.roles.removeUser.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemoveUser}
	onCancel={cancelRemoveUser}
/>

<!-- Szerepkör törlése megerősítő dialog -->
<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('users.roles.delete.title')}
	description={role
		? t('users.roles.delete.description', {
				name: roleName
			})
		: ''}
	confirmText={t('users.roles.delete.confirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>

<!-- App hozzáadása dialog -->
<CustomDialog
	bind:open={appDialogOpen}
	title={t('users.roles.addApp.title')}
	onClose={closeAppDialog}
>
	{#snippet content()}
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">{t('users.roles.addApp.description')}</p>
			<div class="space-y-2">
				<label for="app-select" class="text-sm font-medium"
					>{t('users.roles.addApp.selectLabel')}</label
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
							<span class="text-muted-foreground">{t('users.roles.addApp.selectPlaceholder')}</span>
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
							<Command.Input placeholder={t('users.roles.addApp.searchPlaceholder')} />
							<Command.List>
								<Command.Empty>{t('users.roles.addApp.noResults')}</Command.Empty>
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
			{addingApp ? t('common.loading') : t('users.roles.addApp.confirm')}
		</Button>
	{/snippet}
</CustomDialog>

<!-- App eltávolítása megerősítő dialog -->
<ConfirmDialog
	bind:open={removeAppDialogOpen}
	title={t('users.roles.removeApp.title')}
	description={appToRemove
		? t('users.roles.removeApp.description', {
				name: (() => {
					const nameObj = appToRemove.name as any;
					return typeof nameObj === 'object' && nameObj !== null
						? nameObj.hu || nameObj.en
						: nameObj;
				})()
			})
		: ''}
	confirmText={t('users.roles.removeApp.confirm')}
	cancelText={t('users.roles.removeApp.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmRemoveApp}
	onCancel={cancelRemoveApp}
/>
