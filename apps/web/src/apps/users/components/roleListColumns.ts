import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	DataTableColumnHeader,
	renderComponent,
	renderSnippet,
	createActionsColumn
} from '$lib/components/ui/data-table';
import type { ColumnDeps } from '$lib/components/ui/data-table';
import type { RoleSelectModel } from '@racona/database/schemas';

interface RoleColumnDeps extends ColumnDeps {
	locale: string;
	onOpen: (role: RoleSelectModel) => void;
	onDelete: (role: RoleSelectModel) => void;
}

/**
 * Többnyelvű JSON mezőből az aktuális locale szerinti értéket adja vissza.
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

/** Szerepkörök lista oszlopdefiníciók */
export function createColumns(deps: RoleColumnDeps): ColumnDef<RoleSelectModel, unknown>[] {
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
						return t('users.roles.columns.name');
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
						return t('users.roles.columns.description');
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
						return t('users.roles.columns.createdAt');
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
		createActionsColumn<RoleSelectModel>((role) => [
			{
				label: t('users.users.actions.open'),
				onClick: () => onOpen(role),
				primary: true
			},
			{
				label: t('users.roles.delete.button'),
				onClick: () => onDelete(role),
				variant: 'destructive'
			}
		])
	];
}

export { resolveLocalizedText };
