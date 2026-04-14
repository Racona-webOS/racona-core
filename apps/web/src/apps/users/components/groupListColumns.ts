import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	DataTableColumnHeader,
	renderComponent,
	renderSnippet,
	createActionsColumn
} from '$lib/components/ui/data-table';
import type { ColumnDeps } from '$lib/components/ui/data-table';
import type { GroupSelectModel } from '@racona/database/schemas';

interface GroupColumnDeps extends ColumnDeps {
	locale: string;
	onOpen: (group: GroupSelectModel) => void;
	onDelete: (group: GroupSelectModel) => void;
}

/**
 * Többnyelvű JSON mezőből az aktuális locale szerinti értéket adja vissza.
 * Fallback: en, majd az első elérhető nyelv.
 */
function resolveLocalizedText(
	value: Record<string, string> | null | undefined,
	locale: string
): string {
	if (!value || typeof value !== 'object') return '—';
	if (value[locale]) return value[locale];
	if (value['en']) return value['en'];
	const keys = Object.keys(value);
	return keys.length > 0 ? value[keys[0]] : '—';
}

/** Csoportok lista oszlopdefiníciók */
export function createColumns(deps: GroupColumnDeps): ColumnDef<GroupSelectModel, unknown>[] {
	const { t, onSort, locale, onOpen, onDelete } = deps;

	return [
		{
			accessorKey: 'name',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.groups.columns.name');
					},
					onSort
				}),
			cell: ({ row }) => {
				const name = resolveLocalizedText(row.original.name as Record<string, string>, locale);
				const escaped = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				const snippet = createRawSnippet(() => ({
					render: () => `<span class="font-medium">${escaped}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'description',
			enableSorting: false,
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.groups.columns.description');
					}
				}),
			cell: ({ row }) => {
				const description = resolveLocalizedText(
					row.original.description as Record<string, string> | null,
					locale
				);
				const escaped = description.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				const snippet = createRawSnippet(() => ({
					render: () =>
						`<div class="max-w-[400px] truncate text-sm" title="${escaped}">${escaped}</div>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'createdAt',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.groups.columns.createdAt');
					},
					onSort
				}),
			cell: ({ row }) => {
				const createdAt = row.original.createdAt;
				const formatted = createdAt ? new Date(createdAt).toLocaleDateString() : '—';
				const snippet = createRawSnippet(() => ({
					render: () =>
						`<span class="text-muted-foreground whitespace-nowrap text-sm">${formatted}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		createActionsColumn<GroupSelectModel>((group) => [
			{
				label: t('users.users.actions.open'),
				onClick: () => onOpen(group),
				primary: true
			},
			{
				label: t('users.groups.delete.button'),
				onClick: () => onDelete(group),
				variant: 'destructive'
			}
		])
	];
}

export { resolveLocalizedText };
