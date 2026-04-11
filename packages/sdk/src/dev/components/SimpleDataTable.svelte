<script lang="ts" generics="TData">
	/**
	 * SimpleDataTable — Standalone fejlesztői mód adattábla komponens.
	 *
	 * Szimulálja a core DataTable komponenst @tanstack/table-core és $lib importok nélkül.
	 * Ugyanolyan props API-t használ mint a core DataTable.
	 *
	 * Támogatja:
	 * - Lapozás (előző/következő/oldalszámok)
	 * - Rendezés (oszlopfejlécre kattintva)
	 * - Oldal méret váltó
	 * - Toolbar snippet (keresés, action gombok)
	 * - Loading állapot
	 * - Üres állapot
	 * - createActionsColumn kompatibilis akció oszlop
	 */

	import type { Snippet } from 'svelte';
	import SimpleRowActions from './SimpleRowActions.svelte';

	interface PaginationInfo {
		page: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
	}

	interface DataTableState {
		page: number;
		pageSize: number;
		sortBy: string;
		sortOrder: 'asc' | 'desc';
	}

	/** Egyszerűsített oszlop definíció — kompatibilis a core ColumnDef-fel */
	interface SimpleColumn {
		id?: string;
		accessorKey?: string;
		header?: string | ((ctx: { column: SimpleColumnMeta }) => string | null);
		cell?: (ctx: { row: { original: TData } }) => unknown;
		enableSorting?: boolean;
		enableHiding?: boolean;
		meta?: { title?: string };
	}

	interface SimpleColumnMeta {
		id: string;
	}

	interface Props {
		columns: SimpleColumn[];
		data: TData[];
		pagination: PaginationInfo;
		loading?: boolean;
		striped?: boolean;
		pageSizes?: number[];
		initialSortBy?: string;
		initialSortOrder?: 'asc' | 'desc';
		initialPageSize?: number;
		onStateChange?: (state: DataTableState) => void;
		toolbar?: Snippet;
		onRowClick?: (row: TData) => void;
	}

	let {
		columns,
		data,
		pagination,
		loading = false,
		striped = false,
		pageSizes = [10, 20, 50, 100],
		initialSortBy,
		initialSortOrder = 'desc',
		initialPageSize = 20,
		onStateChange,
		toolbar,
		onRowClick
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let sortBy = $state(initialSortBy ?? '');
	// svelte-ignore state_referenced_locally
	let sortOrder = $state<'asc' | 'desc'>(initialSortOrder);

	function emitState() {
		onStateChange?.({
			page: pagination.page,
			pageSize: pagination.pageSize,
			sortBy,
			sortOrder
		});
	}

	function setPage(newPage: number) {
		onStateChange?.({ page: newPage, pageSize: pagination.pageSize, sortBy, sortOrder });
	}

	function setPageSize(newSize: number) {
		onStateChange?.({ page: 1, pageSize: newSize, sortBy, sortOrder });
	}

	function handleSort(colId: string) {
		if (sortBy === colId) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = colId;
			sortOrder = 'asc';
		}
		onStateChange?.({ page: 1, pageSize: pagination.pageSize, sortBy, sortOrder });
	}

	/** Oszlop ID meghatározása */
	function colId(col: SimpleColumn): string {
		return col.id ?? col.accessorKey ?? '';
	}

	/** Oszlop fejléc szöveg */
	function colHeader(col: SimpleColumn): string {
		if (typeof col.header === 'string') return col.header;
		if (typeof col.header === 'function') {
			const result = col.header({ column: { id: colId(col) } });
			if (result === null || result === undefined) return '';
			if (typeof result === 'string') return result;
			// renderComponent eredménye: { __mockRenderComponent: true, props: { title, ... } }
			if (typeof result === 'object' && (result as any).props?.title) {
				return String((result as any).props.title);
			}
			// meta.title fallback
			return col.meta?.title ?? colId(col);
		}
		return col.meta?.title ?? colId(col);
	}

	/** Cella értéke — string-gé konvertálva */
	function cellValue(col: SimpleColumn, row: TData): string {
		if (col.cell) {
			try {
				const result = col.cell({ row: { original: row } });
				if (result === null || result === undefined) return accessorValue(col, row);
				// Üres string = renderSnippet eredménye → accessorKey fallback
				if (typeof result === 'string' && result === '') return accessorValue(col, row);
				if (typeof result === 'string') return result;
				return accessorValue(col, row);
			} catch {
				return accessorValue(col, row);
			}
		}
		return accessorValue(col, row);
	}

	/** accessorKey alapján kinyeri az értéket a sorból */
	function accessorValue(col: SimpleColumn, row: TData): string {
		const id = colId(col);
		console.log(
			'[accessorValue] id:',
			id,
			'col.id:',
			col.id,
			'col.accessorKey:',
			col.accessorKey,
			'row[id]:',
			(row as any)[id]
		);
		if (id && id !== 'actions') {
			const val = (row as Record<string, unknown>)[id];
			return val !== null && val !== undefined ? String(val) : '—';
		}
		return '';
	}

	/** Akció oszlop-e */
	function isActionsColumn(col: SimpleColumn): boolean {
		return colId(col) === 'actions';
	}

	/** Akciók kinyerése az akció oszlopból */
	function getActions(
		col: SimpleColumn,
		row: TData
	): Array<{
		label: string;
		onClick: (r: unknown) => void;
		variant?: 'default' | 'destructive';
		separator?: boolean;
		primary?: boolean;
	}> {
		if (!col.cell) return [];
		// A createActionsColumn cell függvénye egy { actions, row } props objektumot vár
		// De mi itt közvetlenül a SimpleRowActions-nek adjuk át
		// Ezért a cell-t meghívjuk és az eredményből kinyerjük az actions-t
		const result = col.cell({ row: { original: row } }) as any;
		if (result && typeof result === 'object' && Array.isArray(result.props?.actions)) {
			return result.props.actions;
		}
		return [];
	}

	/** Rendezési ikon */
	function sortIcon(colId_: string): string {
		if (sortBy !== colId_) return '↕';
		return sortOrder === 'asc' ? '↑' : '↓';
	}

	/** Lapozó oldalszámok */
	const pageNumbers = $derived.by(() => {
		const total = pagination.totalPages;
		const current = pagination.page;
		if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
		if (current <= 3) return [1, 2, 3, 4, 5];
		if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
		return [current - 2, current - 1, current, current + 1, current + 2];
	});

	const visibleColumns = $derived(columns.filter((c) => colId(c) !== ''));
</script>

<div class="simple-datatable">
	<!-- Toolbar -->
	{#if toolbar}
		<div class="toolbar">
			{@render toolbar()}
		</div>
	{/if}

	<!-- Tábla -->
	<div class="table-wrapper" class:loading>
		{#if loading}
			<div class="loading-bar"><div class="loading-bar-inner"></div></div>
		{/if}
		<table>
			<thead>
				<tr>
					{#each visibleColumns as col (colId(col))}
						{@const id = colId(col)}
						{@const sortable = col.enableSorting !== false && id !== 'actions'}
						<th class:sortable onclick={sortable ? () => handleSort(id) : undefined}>
							<span class="th-content">
								{colHeader(col)}
								{#if sortable}
									<span class="sort-icon" class:active={sortBy === id}>
										{sortIcon(id)}
									</span>
								{/if}
							</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class:faded={loading}>
				{#each data as row, i (i)}
					<tr
						class:striped-row={striped && i % 2 === 1}
						class:clickable={!!onRowClick}
						onclick={onRowClick ? () => onRowClick(row) : undefined}
					>
						{#each visibleColumns as col (colId(col))}
							<td>
								{#if isActionsColumn(col)}
									{@const actions = getActions(col, row)}
									{#if actions.length > 0}
										<SimpleRowActions {actions} {row} />
									{/if}
								{:else}
									{cellValue(col, row)}
								{/if}
							</td>
						{/each}
					</tr>
				{:else}
					<tr>
						<td colspan={visibleColumns.length} class="empty"> Nincs megjeleníthető adat </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Lapozó -->
	<div class="pagination">
		<span class="total">Összesen: {pagination.totalCount} sor</span>
		<div class="pagination-controls">
			<div class="page-size">
				<span>Sorok / oldal</span>
				<select
					value={pagination.pageSize}
					onchange={(e) => setPageSize(Number((e.target as HTMLSelectElement).value))}
					disabled={loading}
				>
					{#each pageSizes as size}
						<option value={size}>{size}</option>
					{/each}
				</select>
			</div>
			<div class="page-buttons">
				<button onclick={() => setPage(1)} disabled={pagination.page <= 1 || loading}>«</button>
				<button
					onclick={() => setPage(pagination.page - 1)}
					disabled={pagination.page <= 1 || loading}
				>
					Előző
				</button>
				{#each pageNumbers as num (num)}
					<button
						class:active={num === pagination.page}
						onclick={() => setPage(num)}
						disabled={loading}
					>
						{num}
					</button>
				{/each}
				<button
					onclick={() => setPage(pagination.page + 1)}
					disabled={pagination.page >= pagination.totalPages || loading}
				>
					Következő
				</button>
				<button
					onclick={() => setPage(pagination.totalPages)}
					disabled={pagination.page >= pagination.totalPages || loading}
				>
					»
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.simple-datatable {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.table-wrapper {
		position: relative;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.loading-bar {
		position: absolute;
		inset-x: 0;
		top: 0;
		z-index: 10;
		background: rgba(99, 102, 241, 0.15);
		height: 2px;
		overflow: hidden;
	}

	.loading-bar-inner {
		position: absolute;
		animation: shimmer 1.2s ease-in-out infinite;
		background: #6366f1;
		width: 33%;
		height: 100%;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(400%);
		}
	}

	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.875rem;
	}

	thead {
		background: rgba(99, 102, 241, 0.04);
	}

	th {
		border-bottom: 1px solid #e2e8f0;
		padding: 0.625rem 0.75rem;
		color: #64748b;
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.025em;
		text-align: left;
		white-space: nowrap;
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
	}

	th.sortable:hover {
		background: rgba(99, 102, 241, 0.06);
	}

	.th-content {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.sort-icon {
		color: #cbd5e1;
		font-size: 0.7rem;
	}

	.sort-icon.active {
		color: #6366f1;
	}

	tbody tr {
		transition: background 0.1s;
		border-bottom: 1px solid #f1f5f9;
	}

	tbody tr:last-child {
		border-bottom: none;
	}

	tbody tr.striped-row {
		background: rgba(0, 0, 0, 0.02);
	}

	tbody tr.clickable {
		cursor: pointer;
	}

	tbody tr.clickable:hover {
		background: rgba(99, 102, 241, 0.04);
	}

	tbody.faded {
		opacity: 0.4;
		pointer-events: none;
	}

	td {
		padding: 0.625rem 0.75rem;
		color: #1e293b;
	}

	td.empty {
		padding: 2rem;
		color: #94a3b8;
		text-align: center;
	}

	.pagination {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0 0.25rem;
	}

	.total {
		color: #64748b;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.pagination-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.page-size {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #64748b;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.page-size select {
		cursor: pointer;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		padding: 0 0.5rem;
		height: 2rem;
		font-size: 0.875rem;
	}

	.page-buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	.page-buttons button {
		transition: background 0.1s;
		cursor: pointer;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: transparent;
		padding: 0 0.5rem;
		min-width: 2rem;
		height: 2rem;
		font-size: 0.8125rem;
	}

	.page-buttons button:hover:not(:disabled) {
		background: #f1f5f9;
	}

	.page-buttons button.active {
		border-color: #6366f1;
		background: #6366f1;
		color: #fff;
	}

	.page-buttons button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
