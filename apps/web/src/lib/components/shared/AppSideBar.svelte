<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: any;
		appName: string;
		width?: number | 'auto';
		customFooter?: Snippet;
	}

	let { children, appName, width = 230, customFooter }: Props = $props();

	let isCollapsed = $state(false);

	$effect(() => {
		const stored = localStorage.getItem(`app-sidebar-collapsed-${appName}`);
		if (stored !== null) {
			isCollapsed = JSON.parse(stored);
		}
	});

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
		localStorage.setItem(`app-sidebar-collapsed-${appName}`, JSON.stringify(isCollapsed));
	}

	const sidebarWidth = $derived(width === 'auto' ? 'auto' : `${width}px`);
	const maxWidth = $derived(width === 'auto' ? '400px' : undefined);
</script>

<div class="app-sidebar-container" class:collapsed={isCollapsed}>
	<div
		class="app-sidebar"
		style:--sidebar-width={sidebarWidth}
		style:--sidebar-max-width={maxWidth}
	>
		<div class="app-sidebar-content">
			{@render children()}
		</div>
		{#if customFooter}
			<div class="app-sidebar-footer">
				{@render customFooter()}
			</div>
		{/if}
	</div>
	<button
		class="sidebar-toggle"
		onclick={toggleSidebar}
		aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		title={isCollapsed ? 'Expand' : 'Collapse'}
	>
		<span class="icon-wrapper">
			{#if isCollapsed}
				<ChevronRight size={14} />
			{:else}
				<ChevronLeft size={14} />
			{/if}
		</span>
	</button>
</div>

<style>
	.app-sidebar-container {
		display: flex;
		position: relative;
		align-items: stretch;
	}

	.app-sidebar {
		display: flex;
		flex-shrink: 0;
		flex-direction: column;
		transition:
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: var(--radius-md);
		background: linear-gradient(
			to bottom right,
			var(--color-neutral-200),
			var(--color-neutral-100)
		);
		width: var(--sidebar-width);
		max-width: var(--sidebar-width);
		overflow: hidden;
	}

	.app-sidebar-content {
		flex: 1;
		padding: 1rem;
		width: var(--sidebar-width);
		max-width: var(--sidebar-max-width);
		overflow-y: auto;

		&::-webkit-scrollbar {
			width: 4px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			border-radius: 2px;
			background: var(--color-neutral-300);
		}

		&::-webkit-scrollbar-thumb:hover {
			background: var(--color-neutral-400);
		}
	}

	.app-sidebar-footer {
		flex-shrink: 0;
		border-top: 1px solid var(--color-neutral-300);
		padding: 1rem;
		width: var(--sidebar-width);
		max-width: var(--sidebar-max-width);
	}

	.app-sidebar-container.collapsed .app-sidebar {
		border-radius: 0;
		width: 0;
		max-width: 0;
	}

	.sidebar-toggle {
		display: flex;
		flex: 0 0 28px;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		margin-left: 0.375rem;
		border: none;
		background: transparent;
		padding: 0;
		color: var(--color-neutral-400);

		&:active {
			transform: scale(0.96);
		}
	}

	.icon-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.2s ease-out;
		border-radius: 50%;
		width: 24px;
		height: 24px;
	}

	.sidebar-toggle:hover .icon-wrapper {
		background: var(--primary);
		color: white;
	}

	.app-sidebar-container.collapsed .sidebar-toggle {
		margin-left: 0;
	}

	:global {
		.dark {
			.app-sidebar {
				background: linear-gradient(
					to bottom right,
					var(--color-neutral-900),
					var(--color-neutral-800)
				);
			}

			.app-sidebar-content {
				&::-webkit-scrollbar-thumb {
					background: var(--color-neutral-600);
				}

				&::-webkit-scrollbar-thumb:hover {
					background: var(--color-neutral-500);
				}
			}

			.app-sidebar-footer {
				border-top-color: var(--color-neutral-700);
			}

			.sidebar-toggle:hover .icon-wrapper {
				background: var(--primary);
				color: white;
			}
		}
	}
</style>
