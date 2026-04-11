<script lang="ts">
	/**
	 * SimpleRowActions — Standalone fejlesztői mód akció gomb komponens.
	 *
	 * Szimulálja a core DataTableRowActions komponenst:
	 * - 1 akció: egyszerű gomb
	 * - 2+ akció: primary gomb + dropdown a többinek
	 *
	 * Nem függ $lib importoktól, csak plain HTML + Svelte 5 runes.
	 */

	interface RowAction {
		label: string;
		onClick: (row: unknown) => void;
		variant?: 'default' | 'destructive';
		separator?: boolean;
		primary?: boolean;
	}

	interface Props {
		actions: RowAction[];
		row: unknown;
	}

	let { actions, row }: Props = $props();

	const primaryAction = $derived(actions.find((a) => a.primary) ?? actions[0]);
	const secondaryActions = $derived(actions.filter((a) => a !== primaryAction));

	let dropdownOpen = $state(false);

	function toggleDropdown(e: MouseEvent) {
		e.stopPropagation();
		dropdownOpen = !dropdownOpen;
	}

	function handleOutsideClick() {
		dropdownOpen = false;
	}
</script>

<svelte:window onclick={handleOutsideClick} />

{#if !primaryAction}
	<!-- nincs akció -->
{:else if secondaryActions.length === 0}
	<button
		class="action-btn {primaryAction.variant === 'destructive' ? 'destructive' : ''}"
		onclick={() => primaryAction.onClick(row)}
	>
		{primaryAction.label}
	</button>
{:else}
	<div class="action-group">
		<button
			class="action-btn primary {primaryAction.variant === 'destructive' ? 'destructive' : ''}"
			onclick={() => primaryAction.onClick(row)}
		>
			{primaryAction.label}
		</button>
		<div class="dropdown-wrapper">
			<button class="action-btn chevron" onclick={toggleDropdown} aria-label="További műveletek">
				▾
			</button>
			{#if dropdownOpen}
				<div class="dropdown-menu">
					{#each secondaryActions as action (action.label)}
						{#if action.separator}
							<hr class="dropdown-sep" />
						{/if}
						<button
							class="dropdown-item {action.variant === 'destructive' ? 'destructive' : ''}"
							onclick={(e) => {
								e.stopPropagation();
								action.onClick(row);
								dropdownOpen = false;
							}}
						>
							{action.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.action-btn {
		display: inline-flex;
		align-items: center;
		transition: background 0.15s;
		cursor: pointer;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: transparent;
		padding: 0 0.625rem;
		height: 1.75rem;
		font-weight: 500;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.action-btn:hover {
		background: #f1f5f9;
	}

	.action-btn.destructive {
		border-color: #fecaca;
		color: #dc2626;
	}

	.action-btn.destructive:hover {
		background: #fef2f2;
	}

	.action-group {
		display: inline-flex;
		align-items: center;
	}

	.action-btn.primary {
		border-right: none;
		border-radius: 0.375rem 0 0 0.375rem;
	}

	.action-btn.chevron {
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0 0.375rem;
	}

	.dropdown-wrapper {
		position: relative;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 50;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		padding: 0.25rem;
		min-width: 140px;
	}

	.dropdown-item {
		display: block;
		cursor: pointer;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		padding: 0.375rem 0.625rem;
		width: 100%;
		font-size: 0.8125rem;
		text-align: left;
	}

	.dropdown-item:hover {
		background: #f1f5f9;
	}

	.dropdown-item.destructive {
		color: #dc2626;
	}

	.dropdown-item.destructive:hover {
		background: #fef2f2;
	}

	.dropdown-sep {
		margin: 0.25rem 0;
		border: none;
		border-top: 1px solid #e2e8f0;
	}
</style>
