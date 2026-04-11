/**
 * Mock DataTable segédfüggvények — Standalone fejlesztői mód.
 *
 * Szimulálja a core data-table helper függvényeit:
 * - createActionsColumn
 * - renderComponent (no-op, SimpleDataTable közvetlenül kezeli)
 * - renderSnippet (no-op, SimpleDataTable közvetlenül kezeli)
 * - DataTableColumnHeader (egyszerű wrapper)
 */

export interface MockRowAction<TData = unknown> {
	label: string;
	onClick: (row: TData) => void;
	variant?: 'default' | 'destructive';
	separator?: boolean;
	primary?: boolean;
	icon?: string;
}

/**
 * Mock createActionsColumn — kompatibilis a core createActionsColumn-nal.
 *
 * A SimpleDataTable felismeri az 'actions' id-jű oszlopot és a SimpleRowActions
 * komponenssel rendereli. Az actions-t a cell függvény props-ként adja vissza.
 */
export function createActionsColumn<TData>(
	actions: MockRowAction<TData>[] | ((row: TData) => MockRowAction<TData>[])
): {
	id: string;
	enableSorting: boolean;
	enableHiding: boolean;
	cell: (ctx: { row: { original: TData } }) => {
		props: { actions: MockRowAction<unknown>[]; row: TData };
	};
} {
	return {
		id: 'actions',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }: { row: { original: TData } }) => {
			const resolvedActions = typeof actions === 'function' ? actions(row.original) : actions;
			return {
				props: {
					actions: resolvedActions as MockRowAction<unknown>[],
					row: row.original
				}
			};
		}
	};
}

/**
 * Mock renderComponent — standalone módban no-op, a SimpleDataTable
 * közvetlenül kezeli az oszlop fejléceket és cellákat.
 *
 * Visszaad egy marker objektumot, amit a SimpleDataTable felismer.
 */
export function renderComponent(
	_component: unknown,
	props: Record<string, unknown>
): Record<string, unknown> {
	return { __mockRenderComponent: true, props };
}

/**
 * Mock renderSnippet — standalone módban a snippet render függvényét hívja meg
 * és visszaadja a HTML stringet.
 */
export function renderSnippet(
	snippet: { render?: () => string } | unknown,
	_props: unknown
): string {
	if (snippet && typeof snippet === 'object' && 'render' in snippet) {
		const s = snippet as { render: () => string };
		try {
			return s.render();
		} catch {
			return '';
		}
	}
	return '';
}

/**
 * Mock DataTableColumnHeader — standalone módban egyszerű szöveg wrapper.
 * A SimpleDataTable a meta.title vagy az onSort callback alapján kezeli.
 */
export const DataTableColumnHeader = {
	__mockComponent: true,
	name: 'DataTableColumnHeader'
};
