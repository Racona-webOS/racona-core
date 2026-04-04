<script lang="ts">
	import type { DesktopShortcut } from '$lib/types/desktop';
	import type { AppMetadata } from '$lib/types/window';
	import { getDesktopStore, getWindowManager, GRID_SIZE } from '$lib/stores';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { CustomDialog, ConfirmDialog } from '$lib/components/ui';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { UniversalIcon } from '$lib/components/shared';
	import { getContext } from 'svelte';
	import type { DesktopSettings } from '$lib/types/settings';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	let {
		shortcut,
		appMetadata
	}: {
		shortcut: DesktopShortcut;
		appMetadata: AppMetadata | null;
	} = $props();

	const desktopStore = getDesktopStore();
	const windowManager = getWindowManager();
	const settings = getContext<{ desktop: DesktopSettings }>('settings');

	let isDragging = $state(false);
	let hasMoved = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });
	let tempPosition = $state({ x: 0, y: 0 });
	let renameDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let renameValue = $state('');
	let isSubmitting = $state(false);

	const isSelected = $derived(desktopStore.selectedShortcutId === shortcut.id);
	const isSingleClickMode = $derived(settings?.desktop?.clickMode === 'single');

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return; // Only left click

		e.preventDefault();
		e.stopPropagation();

		desktopStore.selectShortcut(shortcut.id);

		isDragging = true;
		hasMoved = false;
		dragOffset = {
			x: e.clientX - shortcut.position.x,
			y: e.clientY - shortcut.position.y
		};

		tempPosition = { ...shortcut.position };

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		const workspace = document.getElementById('workspace');
		if (!workspace) return;

		const rect = workspace.getBoundingClientRect();
		let newX = e.clientX - dragOffset.x;
		let newY = e.clientY - dragOffset.y;

		// Constrain to workspace bounds
		newX = Math.max(0, Math.min(newX, rect.width - GRID_SIZE));
		newY = Math.max(0, Math.min(newY, rect.height - GRID_SIZE));

		// Check if position actually changed
		if (newX !== tempPosition.x || newY !== tempPosition.y) {
			hasMoved = true;
		}

		tempPosition = { x: newX, y: newY };
	}

	async function handleMouseUp() {
		if (!isDragging) return;

		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);

		// Snap to grid
		const snappedPosition = desktopStore.snapToGrid(tempPosition);

		// Update position if changed
		if (snappedPosition.x !== shortcut.position.x || snappedPosition.y !== shortcut.position.y) {
			// Keep tempPosition until server responds
			await desktopStore.updatePosition(shortcut.id, snappedPosition);
		}

		// Only stop dragging after position is updated
		isDragging = false;
	}

	function handleDoubleClick() {
		if (!appMetadata) return;

		windowManager.openWindow(appMetadata.appName, appMetadata.title, appMetadata);
	}

	function handleClick(e: MouseEvent) {
		// Ha volt mozgatás, ne nyissuk meg az appot
		if (hasMoved) {
			return;
		}

		e.stopPropagation();
		desktopStore.selectShortcut(shortcut.id);

		// Egyszeres kattintás módban megnyitjuk az appot
		if (isSingleClickMode) {
			handleDoubleClick();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleDoubleClick();
		}
	}

	async function handleDelete() {
		await desktopStore.deleteShortcut(shortcut.id);
	}

	function handleDeleteClick() {
		deleteDialogOpen = true;
	}

	function handleDeleteCancel() {
		deleteDialogOpen = false;
	}

	function handleRename() {
		renameValue = displayLabel;
		renameDialogOpen = true;
	}

	async function handleRenameSubmit() {
		if (!renameValue.trim() || renameValue === displayLabel) {
			renameDialogOpen = false;
			return;
		}

		isSubmitting = true;
		try {
			await desktopStore.updateLabel(shortcut.id, renameValue.trim());
			renameDialogOpen = false;
		} catch (error) {
			console.error('[DesktopShortcut] Error renaming:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleRenameCancel() {
		renameDialogOpen = false;
	}

	const displayLabel = $derived(shortcut.label || appMetadata?.title || shortcut.appId);
	const position = $derived(isDragging ? tempPosition : shortcut.position);
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div
			class="desktop-shortcut"
			class:selected={isSelected}
			class:dragging={isDragging}
			style:left="{position.x}px"
			style:top="{position.y}px"
			onmousedown={handleMouseDown}
			ondblclick={handleDoubleClick}
			onclick={handleClick}
			onkeydown={handleKeyDown}
			role="button"
			tabindex="0"
		>
			<div class="shortcut-icon" class:cover={appMetadata?.iconStyle === 'cover'}>
				{#if appMetadata?.icon}
					<UniversalIcon
						icon={appMetadata.icon}
						size={appMetadata.iconStyle === 'cover' ? 64 : 32}
						appName={shortcut.appId}
					/>
				{:else}
					<div class="icon-placeholder">?</div>
				{/if}
			</div>
			<div class="shortcut-label">{displayLabel}</div>
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content class="z-1000">
		<ContextMenu.Item onclick={handleDoubleClick}>{t('desktop.shortcut.open')}</ContextMenu.Item>
		<ContextMenu.Item onclick={handleRename}>{t('desktop.shortcut.rename')}</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item onclick={handleDeleteClick} class="text-destructive"
			>{t('desktop.shortcut.delete')}</ContextMenu.Item
		>
	</ContextMenu.Content>
</ContextMenu.Root>

<CustomDialog
	bind:open={renameDialogOpen}
	title={t('desktop.shortcut.renameDialog.title')}
	onClose={handleRenameCancel}
>
	{#snippet content()}
		<div class="space-y-2">
			<label for="shortcut-name" class="text-sm font-medium"
				>{t('desktop.shortcut.renameDialog.label')}</label
			>
			<Input
				id="shortcut-name"
				type="text"
				bind:value={renameValue}
				placeholder={t('desktop.shortcut.renameDialog.placeholder')}
				disabled={isSubmitting}
			/>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="outline" onclick={handleRenameCancel} disabled={isSubmitting}
			>{t('common.buttons.cancel')}</Button
		>
		<Button onclick={handleRenameSubmit} disabled={isSubmitting || !renameValue.trim()}>
			{isSubmitting
				? t('desktop.shortcut.renameDialog.saving')
				: t('desktop.shortcut.renameDialog.save')}
		</Button>
	{/snippet}
</CustomDialog>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('desktop.shortcut.deleteDialog.title')}
	description={t('desktop.shortcut.deleteDialog.description')}
	confirmText={t('common.buttons.delete')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={handleDelete}
	onCancel={handleDeleteCancel}
/>

<style>
	.desktop-shortcut {
		display: flex;
		position: absolute;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.75rem;
		width: 110px;
		user-select: none;
	}

	.desktop-shortcut:hover .shortcut-icon {
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.2),
			0 6px 12px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		border-color: rgba(255, 255, 255, 0.6);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%);
	}

	.desktop-shortcut:hover .shortcut-label {
		text-shadow:
			0 2px 6px rgba(0, 0, 0, 0.95),
			0 0 16px rgba(0, 0, 0, 0.7);
	}

	.desktop-shortcut.selected .shortcut-icon {
		box-shadow:
			0 0 0 3px hsl(var(--primary) / 0.4),
			0 8px 24px rgba(0, 0, 0, 0.2),
			0 4px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.desktop-shortcut.dragging {
		opacity: 0.7;
		cursor: grabbing;
	}

	.shortcut-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		backdrop-filter: blur(20px);
		transition: box-shadow 0.2s ease;
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 20px;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.25) 0%,
			rgba(255, 255, 255, 0.1) 100%
		);
		padding: 12px;
		width: 64px;
		height: 64px;
	}

	.shortcut-icon.cover {
		padding: 0;
		overflow: hidden;
	}

	.shortcut-icon.cover :global(.universal-icon) {
		width: 100%;
		height: 100%;
	}

	.shortcut-icon.cover :global(img) {
		border-radius: 0;
		width: 100% !important;
		height: 100% !important;
		object-fit: cover !important;
	}

	.shortcut-icon.cover :global(.svg-container) {
		display: flex;
		justify-content: stretch;
		align-items: stretch;
		width: 100% !important;
		height: 100% !important;
	}

	.shortcut-icon.cover :global(.svg-container svg) {
		width: 100% !important;
		height: 100% !important;
	}

	.shortcut-icon :global(svg) {
		color: rgba(0, 0, 0, 0.7) !important;
	}

	.icon-placeholder {
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
		width: 100%;
		height: 100%;
		color: rgba(0, 0, 0, 0.5);
		font-weight: 600;
		font-size: 1.5rem;
	}

	.shortcut-label {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		transition: text-shadow 0.2s ease;
		max-width: 100%;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		color: #fff;
		font-weight: 500;
		font-size: 0.7rem;
		line-height: 1.3;
		text-align: center;
		text-overflow: ellipsis;
		text-shadow:
			0 1px 3px rgba(0, 0, 0, 0.8),
			0 0 8px rgba(0, 0, 0, 0.5);
		word-wrap: break-word;
	}
</style>
