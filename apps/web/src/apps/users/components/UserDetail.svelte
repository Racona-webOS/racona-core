<script lang="ts">
	import { untrack, tick } from 'svelte';
	import { useId } from 'bits-ui';
	import { Button } from '$lib/components/ui/button';
	import { ButtonEdit, ButtonSave, ButtonCancel, IconButton } from '$lib/components/shared/buttons';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { cn } from '$lib/utils/utils';
	import {
		X,
		Check,
		UserX,
		UserCheck,
		Plus,
		Shield,
		Users,
		ArrowLeft,
		Ban
	} from 'lucide-svelte/icons';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import {
		fetchUser,
		fetchAvailableGroups,
		fetchAvailableRoles,
		addUserToGroup,
		removeUserFromGroup,
		addUserToRole,
		removeUserFromRole,
		setUserActiveStatus
	} from '../users.remote';
	import type { UserSelectModel, GroupSelectModel, RoleSelectModel } from '@racona/database/schemas';
	import { toast } from 'svelte-sonner';
	import { ConfirmDialog } from '$lib/components/ui';

	interface Props {
		userId: number;
		returnTo?: string;
	}

	let { userId, returnTo = 'UserList' }: Props = $props();

	const shell = getAppShell();
	const actionBar = getActionBar();
	const { t, locale } = useI18n();

	let user = $state<UserSelectModel | null>(null);
	let groups = $state<GroupSelectModel[]>([]);
	let roles = $state<RoleSelectModel[]>([]);
	let isActive = $state<boolean>(true);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let editing = $state(false);

	// Inaktiválás megerősítő dialog állapot
	let deactivateDialogOpen = $state(false);
	let deactivating = $state(false);

	// Szerkesztési form state
	let formName = $state('');
	let formEmail = $state('');
	let formUsername = $state('');

	// Szerkesztési state - csoportok és szerepkörök
	let editingGroups = $state<GroupSelectModel[]>([]);
	let editingRoles = $state<RoleSelectModel[]>([]);
	let originalGroups = $state<GroupSelectModel[]>([]);
	let originalRoles = $state<RoleSelectModel[]>([]);

	// Combobox state - Groups
	let groupComboboxOpen = $state(false);
	let availableGroups = $state<GroupSelectModel[]>([]);
	let selectedGroupId = $state<string>('');
	const groupTriggerId = useId();

	// Combobox state - Roles
	let roleComboboxOpen = $state(false);
	let availableRoles = $state<RoleSelectModel[]>([]);
	let selectedRoleId = $state<string>('');
	const roleTriggerId = useId();

	function handleBack() {
		actionBar.clear();
		// Ha van returnTo és groupId, akkor azt is átadjuk
		if (returnTo === 'GroupDetail') {
			const props = $state.snapshot(shell.componentProps);
			shell.navigateTo(returnTo, { groupId: props.groupId });
		} else {
			shell.navigateTo(returnTo);
		}
	}

	function startEditing() {
		if (!user) return;
		formName = user.name;
		formEmail = user.email;
		formUsername = user.username ?? '';
		// Másoljuk le az eredeti csoportokat és szerepköröket
		editingGroups = [...groups];
		editingRoles = [...roles];
		originalGroups = [...groups];
		originalRoles = [...roles];
		editing = true;
		actionBar.set(editingActions);
		loadAvailableGroupsAndRoles();
	}

	function cancelEditing() {
		editing = false;
		groupComboboxOpen = false;
		roleComboboxOpen = false;
		// Visszaállítjuk az eredeti állapotot
		editingGroups = [];
		editingRoles = [];
		originalGroups = [];
		originalRoles = [];
		actionBar.set(viewActions);
	}

	async function loadAvailableGroupsAndRoles() {
		if (!user) return;

		const [groupsResult, rolesResult] = await Promise.all([
			fetchAvailableGroups({ userId: user.id }),
			fetchAvailableRoles({ userId: user.id })
		]);

		if (groupsResult.success) {
			// Szűrjük ki azokat, amik már a szerkesztési listában vannak
			availableGroups = groupsResult.data.filter(
				(g) => !editingGroups.some((eg) => eg.id === g.id)
			);
		}

		if (rolesResult.success) {
			// Szűrjük ki azokat, amik már a szerkesztési listában vannak
			availableRoles = rolesResult.data.filter((r) => !editingRoles.some((er) => er.id === r.id));
		}
	}

	function closeGroupComboboxAndFocus() {
		groupComboboxOpen = false;
		tick().then(() => {
			document.getElementById(groupTriggerId)?.focus();
		});
	}

	function closeRoleComboboxAndFocus() {
		roleComboboxOpen = false;
		tick().then(() => {
			document.getElementById(roleTriggerId)?.focus();
		});
	}

	async function handleAddGroup() {
		if (!selectedGroupId || !user) return;

		const groupId = parseInt(selectedGroupId);
		const groupToAdd = availableGroups.find((g) => g.id === groupId);

		if (groupToAdd) {
			// Lokálisan hozzáadjuk
			editingGroups = [...editingGroups, groupToAdd];
			selectedGroupId = '';
			// Frissítjük az elérhető csoportok listáját
			availableGroups = availableGroups.filter((g) => g.id !== groupId);
		}
	}

	async function handleRemoveGroup(groupId: number) {
		if (!user) return;

		const groupToRemove = editingGroups.find((g) => g.id === groupId);

		if (groupToRemove) {
			// Lokálisan eltávolítjuk
			editingGroups = editingGroups.filter((g) => g.id !== groupId);
			// Hozzáadjuk az elérhető csoportokhoz
			availableGroups = [...availableGroups, groupToRemove];
		}
	}

	async function handleAddRole() {
		if (!selectedRoleId || !user) return;

		const roleId = parseInt(selectedRoleId);
		const roleToAdd = availableRoles.find((r) => r.id === roleId);

		if (roleToAdd) {
			// Lokálisan hozzáadjuk
			editingRoles = [...editingRoles, roleToAdd];
			selectedRoleId = '';
			// Frissítjük az elérhető szerepkörök listáját
			availableRoles = availableRoles.filter((r) => r.id !== roleId);
		}
	}

	async function handleRemoveRole(roleId: number) {
		if (!user) return;

		const roleToRemove = editingRoles.find((r) => r.id === roleId);

		if (roleToRemove) {
			// Lokálisan eltávolítjuk
			editingRoles = editingRoles.filter((r) => r.id !== roleId);
			// Hozzáadjuk az elérhető szerepkörökhöz
			availableRoles = [...availableRoles, roleToRemove];
		}
	}

	async function handleSave() {
		if (!user) return;

		try {
			// Meghatározzuk a változásokat
			const groupsToAdd = editingGroups.filter(
				(eg) => !originalGroups.some((og) => og.id === eg.id)
			);
			const groupsToRemove = originalGroups.filter(
				(og) => !editingGroups.some((eg) => eg.id === og.id)
			);
			const rolesToAdd = editingRoles.filter((er) => !originalRoles.some((or) => or.id === er.id));
			const rolesToRemove = originalRoles.filter(
				(or) => !editingRoles.some((er) => er.id === or.id)
			);

			// Összeállítjuk az összes műveletet
			const operations = [];

			// Csoportok hozzáadása
			for (const group of groupsToAdd) {
				operations.push(addUserToGroup({ userId: user.id, groupId: group.id }));
			}

			// Csoportok eltávolítása
			for (const group of groupsToRemove) {
				operations.push(removeUserFromGroup({ userId: user.id, groupId: group.id }));
			}

			// Szerepkörök hozzáadása
			for (const role of rolesToAdd) {
				operations.push(addUserToRole({ userId: user.id, roleId: role.id }));
			}

			// Szerepkörök eltávolítása
			for (const role of rolesToRemove) {
				operations.push(removeUserFromRole({ userId: user.id, roleId: role.id }));
			}

			// TODO: Itt kellene menteni a formName, formEmail, formUsername változásokat is

			// Végrehajtjuk az összes műveletet
			if (operations.length > 0) {
				const results = await Promise.all(operations);
				const hasError = results.some((r) => !r.success);

				if (hasError) {
					toast.error(t('users.users.detail.saveError'));
					return;
				}

				toast.success(t('users.users.detail.saveSuccess'));
			}

			// Frissítjük az adatokat
			await loadUser();
			editing = false;
			actionBar.set(viewActions);
		} catch (err) {
			console.error('Failed to save user changes:', err);
			toast.error(t('users.users.detail.saveError'));
		}
	}

	async function loadUser() {
		loading = true;
		error = null;
		try {
			const result = await fetchUser({ id: userId });
			if (result.success && result.data) {
				user = result.data.user;
				groups = result.data.groups;
				roles = result.data.roles;
				isActive = result.data.isActive;
				// Csak akkor állítsuk be a viewActions-t, ha nem vagyunk szerkesztési módban
				if (!editing) {
					actionBar.set(viewActions);
				}
			} else {
				error = result.error || t('users.users.detail.error');
			}
		} catch (err) {
			console.error('Failed to load user:', err);
			error = t('users.users.detail.error');
		} finally {
			loading = false;
		}
	}

	function handleDeactivateClick() {
		deactivateDialogOpen = true;
	}

	function cancelDeactivate() {
		deactivateDialogOpen = false;
	}

	async function confirmDeactivate() {
		if (!user) return;

		deactivating = true;
		try {
			const newStatus = !isActive;
			const result = await setUserActiveStatus({ userId: user.id, isActive: newStatus });

			if (result.success) {
				toast.success(
					newStatus
						? t('users.users.detail.activateSuccess')
						: t('users.users.detail.deactivateSuccess')
				);
				deactivateDialogOpen = false;
				await loadUser();
			} else {
				toast.error(result.error || t('users.users.detail.deactivateError'));
			}
		} catch (err) {
			console.error('Failed to change user active status:', err);
			toast.error(t('users.users.detail.deactivateError'));
		} finally {
			deactivating = false;
		}
	}

	$effect(() => {
		const id = userId;
		if (id != null && id > 0) {
			untrack(() => loadUser());
		}
	});
</script>

{#snippet viewActions()}
	<ButtonEdit text={t('common.buttons.edit')} onclick={startEditing} />
	<IconButton variant="destructive" text={t('users.users.detail.deleteUser')} onclick={handleSave}>
		{#snippet icon()}<UserX />{/snippet}
	</IconButton>
	{#if isActive}
		<IconButton
			variant="destructive"
			text={t('users.users.detail.deactivateUser')}
			onclick={handleDeactivateClick}
		>
			{#snippet icon()}<Ban />{/snippet}
		</IconButton>
	{:else}
		<IconButton
			variant="default"
			text={t('users.users.detail.activateUser')}
			onclick={handleDeactivateClick}
		>
			{#snippet icon()}<UserCheck />{/snippet}
		</IconButton>
	{/if}
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
		<h2>{user?.name ?? t('users.users.detail.title')}</h2>
	</div>
</div>

{#if loading}
	<div class="flex items-center justify-center py-8">
		<p class="text-muted-foreground">{t('common.status.loading')}</p>
	</div>
{:else if error}
	<div class="error-block">
		<p>{error}</p>
	</div>
{:else if user}
	<div class="detail-grid">
		<div class="detail-field">
			<span class="detail-label">{t('users.users.detail.accountStatus')}</span>
			<span class="detail-value">
				{#if isActive}
					<Badge variant="default" class="bg-green-600">{t('users.users.detail.active')}</Badge>
				{:else}
					<Badge variant="destructive">{t('users.users.detail.inactive')}</Badge>
				{/if}
			</span>
		</div>
		<div class="detail-field">
			<span class="detail-label">{t('users.users.columns.name')}</span>
			{#if editing}
				<Input bind:value={formName} />
			{:else}
				<span class="detail-value">{user.name}</span>
			{/if}
		</div>

		<div class="detail-field">
			<span class="detail-label">{t('users.users.columns.email')}</span>
			{#if editing}
				<Input bind:value={formEmail} />
			{:else}
				<span class="detail-value">{user.email}</span>
			{/if}
		</div>

		<div class="detail-field">
			<span class="detail-label">{t('users.users.columns.username')}</span>
			{#if editing}
				<Input bind:value={formUsername} />
			{:else if user.username}
				<span class="detail-value font-mono">{user.username}</span>
			{:else}
				<span class="detail-value text-muted-foreground">—</span>
			{/if}
		</div>

		<div class="detail-field">
			<span class="detail-label">{t('users.users.columns.emailVerified')}</span>
			<span class="detail-value">
				{#if user.emailVerified}
					<span class="text-green-600">✓</span>
				{:else}
					<span class="text-red-500">✗</span>
				{/if}
			</span>
		</div>

		{#if user.createdAt}
			<div class="detail-field">
				<span class="detail-label">{t('users.users.columns.createdAt')}</span>
				<span class="detail-value">
					{new Date(user.createdAt).toLocaleDateString()}
				</span>
			</div>
		{/if}

		<!-- Csoportok -->
		<div class="detail-field">
			<div class="mb-2 flex items-center gap-2">
				<Users class="text-muted-foreground size-4" />
				<span class="detail-label">{t('users.users.detail.groups')}</span>
			</div>
			{#if (editing ? editingGroups : groups).length > 0 || editing}
				<div class="flex flex-wrap gap-2">
					{#each editing ? editingGroups : groups as group (group.id)}
						<Badge
							variant="secondary"
							class={cn('hover:bg-secondary/80 cursor-pointer', editing && 'pr-1')}
						>
							<span>{typeof group.name === 'object' ? group.name[locale] || '' : group.name}</span>
							{#if editing}
								<button
									type="button"
									onclick={() => handleRemoveGroup(group.id)}
									class="hover:bg-secondary-foreground/20 ml-1 rounded-sm p-0.5"
								>
									<X class="size-3" />
								</button>
							{/if}
						</Badge>
					{/each}
					{#if editing}
						<Popover.Root bind:open={groupComboboxOpen}>
							<Popover.Trigger
								id={groupTriggerId}
								class="border-input hover:bg-accent hover:text-accent-foreground inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2 text-xs transition-colors"
							>
								<Plus class="size-3" />
								<span>{t('users.users.detail.addGroup')}</span>
							</Popover.Trigger>
							<Popover.Content
								class="z-10001 w-(--bits-popover-trigger-width) min-w-[200px] p-0"
								align="start"
								portalProps={{ to: 'body' }}
							>
								<Command.Root
									filter={(value, search) => {
										const searchLower = search.toLowerCase();
										const valueLower = value.toLowerCase();
										return valueLower.includes(searchLower) ? 1 : 0;
									}}
								>
									<Command.Input placeholder={t('users.users.detail.searchGroup')} />
									<Command.List>
										<Command.Empty>{t('users.users.detail.noGroupsAvailable')}</Command.Empty>
										<Command.Group>
											{#each availableGroups as group (group.id)}
												<Command.Item
													value={`${typeof group.name === 'object' ? group.name[locale] || '' : group.name}`}
													onSelect={() => {
														selectedGroupId = group.id.toString();
														closeGroupComboboxAndFocus();
														handleAddGroup();
													}}
												>
													<Check
														class={cn(
															'mr-2 size-4',
															selectedGroupId !== group.id.toString() && 'text-transparent'
														)}
													/>
													<span
														>{typeof group.name === 'object'
															? group.name[locale] || ''
															: group.name}</span
													>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					{/if}
				</div>
			{:else}
				<span class="text-muted-foreground text-sm">{t('users.users.detail.noGroups')}</span>
			{/if}
		</div>

		<!-- Szerepkörök -->
		<div class="detail-field">
			<div class="mb-2 flex items-center gap-2">
				<Shield class="text-muted-foreground size-4" />
				<span class="detail-label">{t('users.users.detail.roles')}</span>
			</div>
			{#if (editing ? editingRoles : roles).length > 0 || editing}
				<div class="flex flex-wrap gap-2">
					{#each editing ? editingRoles : roles as role (role.id)}
						<Badge variant="default" class={cn('cursor-pointer', editing && 'pr-1')}>
							<span>{typeof role.name === 'object' ? role.name[locale] || '' : role.name}</span>
							{#if editing}
								<button
									type="button"
									onclick={() => handleRemoveRole(role.id)}
									class="hover:bg-primary-foreground/20 ml-1 rounded-sm p-0.5"
								>
									<X class="size-3" />
								</button>
							{/if}
						</Badge>
					{/each}
					{#if editing}
						<Popover.Root bind:open={roleComboboxOpen}>
							<Popover.Trigger
								id={roleTriggerId}
								class="border-input hover:bg-accent hover:text-accent-foreground inline-flex h-7 items-center gap-1 rounded-md border bg-transparent px-2 text-xs transition-colors"
							>
								<Plus class="size-3" />
								<span>{t('users.users.detail.addRole')}</span>
							</Popover.Trigger>
							<Popover.Content
								class="z-10001 w-(--bits-popover-trigger-width) min-w-[200px] p-0"
								align="start"
								portalProps={{ to: 'body' }}
							>
								<Command.Root
									filter={(value, search) => {
										const searchLower = search.toLowerCase();
										const valueLower = value.toLowerCase();
										return valueLower.includes(searchLower) ? 1 : 0;
									}}
								>
									<Command.Input placeholder={t('users.users.detail.searchRole')} />
									<Command.List>
										<Command.Empty>{t('users.users.detail.noRolesAvailable')}</Command.Empty>
										<Command.Group>
											{#each availableRoles as role (role.id)}
												<Command.Item
													value={`${typeof role.name === 'object' ? role.name[locale] || '' : role.name}`}
													onSelect={() => {
														selectedRoleId = role.id.toString();
														closeRoleComboboxAndFocus();
														handleAddRole();
													}}
												>
													<Check
														class={cn(
															'mr-2 size-4',
															selectedRoleId !== role.id.toString() && 'text-transparent'
														)}
													/>
													<span
														>{typeof role.name === 'object'
															? role.name[locale] || ''
															: role.name}</span
													>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					{/if}
				</div>
			{:else}
				<span class="text-muted-foreground text-sm">{t('users.users.detail.noRoles')}</span>
			{/if}
		</div>
	</div>
{/if}

<!-- Felhasználó inaktiválás/aktiválás megerősítő dialog -->
<ConfirmDialog
	bind:open={deactivateDialogOpen}
	title={isActive ? t('users.users.detail.deactivateUser') : t('users.users.detail.activateUser')}
	description={user
		? isActive
			? t('users.users.detail.deactivateDescription', { name: user.name, email: user.email })
			: t('users.users.detail.activateDescription', { name: user.name, email: user.email })
		: ''}
	confirmText={isActive
		? t('users.users.detail.deactivateConfirm')
		: t('users.users.detail.activateConfirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant={isActive ? 'destructive' : 'default'}
	onConfirm={confirmDeactivate}
	onCancel={cancelDeactivate}
/>

<style>
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
		max-width: 32rem;
	}

	.detail-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		color: var(--color-neutral-500);
		font-weight: 500;
		font-size: 0.8125rem;
	}

	.detail-value {
		font-size: 0.9375rem;
	}

	.error-block {
		margin: 1rem 0;
		border: 1px solid var(--color-red-200);
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-red-50);
		padding: 1rem;
		color: var(--color-red-700);
	}

	:global(.dark) .error-block {
		border-color: var(--color-red-700);
		background-color: var(--color-red-900);
		color: var(--color-red-200);
	}
</style>
