import type { ColumnDef, CellContext } from '@tanstack/table-core';
import { renderComponent } from './render-helpers';
import DataTableRowActions from './DataTableRowActions.svelte';

/** Egy sor művelet definíciója a dropdown menühöz. */
export interface RowAction<TData> {
	/** A művelet megjelenített neve. */
	label: string;
	/** Opcionális ikon neve (lucide-svelte). */
	icon?: string;
	/** Callback, amely megkapja a sor adatait. */
	onClick: (row: TData) => void;
	/** Vizuális variáns: 'destructive' piros szöveget ad. */
	variant?: 'default' | 'destructive';
	/** Ha true, vizuális elválasztó jelenik meg az elem előtt. */
	separator?: boolean;
	/** Ha true, ez a kiemelt (primary) művelet. Az első ilyen lesz a fő gomb. */
	primary?: boolean;
}

/**
 * Újrafelhasználható műveleti oszlop factory.
 *
 * Elfogad statikus műveleti listát vagy dinamikus callback-et,
 * amely soronként más műveleteket adhat vissza.
 *
 * @param actions - Műveletek listája vagy callback, amely a sor adatai alapján adja vissza a műveleteket.
 * @returns Egy `ColumnDef` objektum, amely dropdown menüt renderel minden sorban.
 */
export function createActionsColumn<TData>(
	actions: RowAction<TData>[] | ((row: TData) => RowAction<TData>[])
): ColumnDef<TData, unknown> {
	return {
		id: 'actions',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }: CellContext<TData, unknown>) => {
			const resolvedActions = typeof actions === 'function' ? actions(row.original) : actions;

			return renderComponent(DataTableRowActions, {
				actions: resolvedActions as RowAction<unknown>[],
				row: row.original
			});
		}
	};
}
