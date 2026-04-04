<script lang="ts">
	import { untrack } from 'svelte';
	import type { MenuItem } from '$lib/types/menu';
	import UniversalIcon from './UniversalIcon.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	interface Props {
		items: MenuItem[];
		activeHref?: string;
		onItemClick?: (item: MenuItem) => void;
		initialExpandedParents?: string[];
		searchable?: boolean;
	}

	let {
		items = [],
		activeHref,
		onItemClick,
		initialExpandedParents = [],
		searchable = false
	}: Props = $props();

	// Search state
	let searchQuery = $state('');

	// Filter items based on search query
	function filterItemsBySearch(items: MenuItem[], query: string): MenuItem[] {
		if (!query.trim()) return items;

		const lowerQuery = query.toLowerCase();
		const filtered: MenuItem[] = [];

		for (const item of items) {
			// Check if current item matches
			const itemMatches = item.label.toLowerCase().includes(lowerQuery);

			// Check children recursively
			const filteredChildren = item.children ? filterItemsBySearch(item.children, query) : [];

			// Include item if it matches or has matching children
			if (itemMatches || filteredChildren.length > 0) {
				filtered.push({
					...item,
					children: filteredChildren.length > 0 ? filteredChildren : item.children
				});
			}
		}

		return filtered;
	}

	// Get parent labels that should be expanded based on search
	function getExpandedParentsForSearch(items: MenuItem[], query: string): string[] {
		if (!query.trim()) return [];

		const lowerQuery = query.toLowerCase();
		const parents: string[] = [];

		function traverse(items: MenuItem[], parentLabels: string[] = []) {
			for (const item of items) {
				if (item.children) {
					const hasMatchingChild = item.children.some((child) =>
						child.label.toLowerCase().includes(lowerQuery)
					);

					if (hasMatchingChild) {
						parents.push(...parentLabels, item.label);
					}

					traverse(item.children, [...parentLabels, item.label]);
				}
			}
		}

		traverse(items);
		return [...new Set(parents)];
	}

	// Filter out hidden items and apply search
	let visibleItems = $derived.by(() => {
		const nonHidden = items.filter((item) => !item.hidden);
		return filterItemsBySearch(nonHidden, searchQuery);
	});

	// Track which menu items are expanded
	let expandedItems = $state<Set<string>>(new Set());
	// Felhasználó által manuálisan bezárt elemek — ezeket nem nyitjuk vissza automatikusan
	let manuallyClosed = $state<Set<string>>(new Set());

	// Auto-expand parents when searching
	$effect(() => {
		if (searchQuery.trim()) {
			const parentsToExpand = getExpandedParentsForSearch(items, searchQuery);
			expandedItems = new Set(parentsToExpand);
			// Clear manually closed when searching
			manuallyClosed = new Set();
		}
	});

	$effect(() => {
		const incoming = initialExpandedParents;
		if (incoming.length === 0) return;
		const closed = manuallyClosed;
		// untrack-kel olvassuk az expandedItems-t, hogy ne triggerelődjön újra
		const current = untrack(() => expandedItems);
		const next = new Set(current);
		let changed = false;
		for (const label of incoming) {
			if (!closed.has(label) && !next.has(label)) {
				next.add(label);
				changed = true;
			}
		}
		if (changed) expandedItems = next;
	});

	function toggleExpand(label: string) {
		const next = new Set(expandedItems);
		if (next.has(label)) {
			next.delete(label);
			manuallyClosed = new Set([...manuallyClosed, label]);
		} else {
			next.add(label);
			const newClosed = new Set(manuallyClosed);
			newClosed.delete(label);
			manuallyClosed = newClosed;
		}
		expandedItems = next;
	}

	function isExpanded(label: string): boolean {
		return expandedItems.has(label);
	}

	function handleClick(item: MenuItem, event: MouseEvent) {
		event.preventDefault();
		onItemClick?.(item);
	}

	function handleParentClick(item: MenuItem, event: MouseEvent) {
		event.preventDefault();
		toggleExpand(item.label);
		// Ha a szülő elemnek van komponense, akkor azt is meghívjuk
		if (item.component) {
			onItemClick?.(item);
		}
	}

	// Filter visible children for parent items
	function getVisibleChildren(item: MenuItem): MenuItem[] {
		return item.children?.filter((child) => !child.hidden) ?? [];
	}
</script>

<div class="sidebar-menu-container">
	{#if searchable}
		<div class="search-wrapper">
			<UniversalIcon icon="Search" size={16} class="search-icon" />
			<Input
				name="menuSearch"
				class="search-input rounded-full"
				placeholder={t('common.sidebar.search')}
				bind:value={searchQuery}
			/>
		</div>
	{/if}

	<nav class="sidebar-menu">
		{#each visibleItems as item}
			<div class="menu-item-wrapper">
				{#if item.separator}
					<!-- Separator line -->
					<div class="menu-separator"></div>
				{:else if item.children && getVisibleChildren(item).length > 0}
					<!-- Parent item with children -->
					<button
						class="menu-item parent"
						class:expanded={isExpanded(item.label)}
						class:active={item.href === activeHref}
						onclick={(e) => handleParentClick(item, e)}
					>
						<div class="menu-item-content">
							{#if item.icon}
								<UniversalIcon icon={item.icon} size={18} />
							{:else}
								<div class="icon-placeholder"></div>
							{/if}
							<span class="label">{item.label}</span>
						</div>
						<svg
							class="chevron"
							class:rotated={isExpanded(item.label)}
							width="14"
							height="14"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M4 6L8 10L12 6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					<!-- Children submenu with smooth animation -->
					<div class="submenu-wrapper" class:expanded={isExpanded(item.label)}>
						<div class="submenu">
							<div class="submenu-indicator"></div>
							{#each getVisibleChildren(item) as child}
								<button
									class="menu-item child"
									class:active={child.href === activeHref}
									onclick={(e) => handleClick(child, e)}
								>
									<div class="menu-item-content">
										{#if child.icon}
											<UniversalIcon icon={child.icon} size={16} />
										{:else}
											<div class="icon-placeholder small"></div>
										{/if}
										<span class="label">{child.label}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- Simple menu item without children -->
					<button
						class="menu-item"
						class:active={item.href === activeHref}
						onclick={(e) => handleClick(item, e)}
					>
						<div class="menu-item-content">
							{#if item.icon}
								<UniversalIcon icon={item.icon} size={18} />
							{:else}
								<div class="icon-placeholder"></div>
							{/if}
							<span class="label">{item.label}</span>
						</div>
					</button>
				{/if}
			</div>
		{/each}
	</nav>
</div>

<style>
	.sidebar-menu-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.search-wrapper {
		display: flex;
		position: relative;
		align-items: center;
		padding: 0 0.25rem;

		:global(.search-icon) {
			position: absolute;
			z-index: 10;
			margin-left: 10px;
			pointer-events: none;
			color: #7f7f7f;
		}

		:global(.search-input) {
			padding-left: 2rem;
		}
	}

	.sidebar-menu {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.menu-item-wrapper {
		display: flex;
		flex-direction: column;
	}

	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.15s ease;
		cursor: pointer;
		border: none;
		border-radius: 999px;
		background: transparent;
		padding: 0.625rem 0.75rem;
		width: 100%;
		color: var(--color-neutral-700);
		font-weight: 500;
		font-size: 0.95rem;
		text-decoration: none;
	}

	.menu-item:hover {
		background-color: var(--color-neutral-300);
		color: var(--color-neutral-900);
	}

	.menu-item.active {
		background-color: var(--color-neutral-300);
		color: var(--color-primary-alpha-70);
		font-weight: 600;
	}

	.menu-item.active:hover {
		background-color: var(--color-neutral-300);
		color: var(--color-primary-alpha-90);
	}

	.menu-item.child {
		padding: 0.5rem 0.625rem 0.5rem 2.25rem;
		color: var(--color-neutral-600);
		font-weight: 400;
		font-size: 0.9rem;
	}

	.menu-item.child:hover {
		color: var(--color-neutral-800);
	}

	.menu-item.child.active {
		background-color: var(--color-neutral-300);
		color: var(--color-primary-alpha-70);
		font-weight: 600;
	}

	.menu-item.child.active:hover {
		background-color: var(--color-neutral-300);
		color: var(--color-primary-alpha-90);
	}

	.menu-item-content {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.625rem;
	}

	.icon-placeholder {
		flex-shrink: 0;
		border-radius: 50%;
		background-color: var(--color-neutral-400);
		width: 18px;
		height: 18px;
	}

	.icon-placeholder.small {
		background-color: var(--color-neutral-400);
		width: 14px;
		height: 14px;
	}

	.label {
		flex: 1;
		line-height: 1.3;
		text-align: left;
	}

	.chevron {
		flex-shrink: 0;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--color-neutral-500);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	/* Smooth submenu animation wrapper using CSS Grid */
	.submenu-wrapper {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}

	.submenu-wrapper.expanded {
		grid-template-rows: 1fr;
	}

	.submenu {
		display: flex;
		position: relative;
		flex-direction: column;
		gap: 0.0625rem;
		padding-top: 0.125rem;
		min-height: 0;
	}

	.submenu-indicator {
		position: absolute;
		top: 0.25rem;
		bottom: 0.25rem;
		left: 0.875rem;
		opacity: 0.6;
		background-color: var(--color-neutral-400);
		width: 1px;
	}

	/* Separator styles */
	.menu-separator {
		margin: 0.5rem 0;
		background-color: var(--color-neutral-300);
		height: 1px;
	}

	/* Dark mode styles */
	:global(.dark) .menu-item {
		color: var(--color-neutral-300);
	}

	:global(.dark) .menu-item:hover {
		background-color: var(--color-neutral-700);
		color: var(--color-neutral-100);
	}

	:global(.dark) .menu-item.active {
		background-color: var(--color-neutral-700);
		color: var(--color-primary-alpha-70);
	}

	:global(.dark) .menu-item.active:hover {
		background-color: var(--color-neutral-700);
		color: var(--color-primary-alpha-90);
	}

	:global(.dark) .menu-item.child {
		color: var(--color-neutral-400);
	}

	:global(.dark) .menu-item.child:hover {
		color: var(--color-neutral-200);
	}

	:global(.dark) .menu-item.child.active {
		background-color: var(--color-neutral-700);
		color: var(--color-primary-alpha-70);
	}

	:global(.dark) .menu-item.child.active:hover {
		background-color: var(--color-neutral-700);
		color: var(--color-primary-alpha-90);
	}

	:global(.dark) .icon-placeholder {
		background-color: var(--color-neutral-600);
	}

	:global(.dark) .icon-placeholder.small {
		background-color: var(--color-neutral-600);
	}

	:global(.dark) .chevron {
		color: var(--color-neutral-500);
	}

	:global(.dark) .menu-separator {
		background-color: var(--color-neutral-700);
	}
</style>
