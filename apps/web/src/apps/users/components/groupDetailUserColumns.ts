import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	DataTableColumnHeader,
	renderComponent,
	renderSnippet
} from '$lib/components/ui/data-table';
import type { ColumnDeps } from '$lib/components/ui/data-table';
import { createActionsColumn } from '$lib/components/ui/data-table';
import type { UserSelectModel } from '@racona/database/schemas';

/** Csoport részletek felhasználó lista oszlopok függőségei. */
export interface GroupDetailUserColumnDeps extends ColumnDeps {
	onOpenUser?: (user: UserSelectModel) => void;
	onRemoveFromGroup?: (user: UserSelectModel) => void;
}

/** Csoport részletek felhasználó lista oszlopdefiníciók. */
export function createColumns(
	deps: GroupDetailUserColumnDeps
): ColumnDef<UserSelectModel, unknown>[] {
	const { t, onSort, onOpenUser, onRemoveFromGroup } = deps;

	const columns: ColumnDef<UserSelectModel, unknown>[] = [
		{
			accessorKey: 'name',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.users.columns.name');
					},
					onSort
				}),
			cell: ({ row }) => {
				const name = String(row.original.name);
				const snippet = createRawSnippet(() => ({
					render: () => `<span class="font-medium">${name}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'email',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.users.columns.email');
					},
					onSort
				}),
			cell: ({ row }) => {
				const email = String(row.original.email);
				const snippet = createRawSnippet(() => ({
					render: () => `<span class="text-sm">${email}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'username',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.users.columns.username');
					},
					onSort
				}),
			cell: ({ row }) => {
				const username = row.original.username;
				const snippet = createRawSnippet(() => ({
					render: () =>
						username
							? `<span class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">${username}</span>`
							: `<span class="text-muted-foreground text-xs">—</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'emailVerified',
			enableSorting: false,
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('users.users.columns.emailVerified');
					}
				}),
			cell: ({ row }) => {
				const verified = row.original.emailVerified;
				const snippet = createRawSnippet(() => ({
					render: () =>
						verified
							? `<span class="text-xs font-medium text-green-600">✓</span>`
							: `<span class="text-xs font-medium text-red-500">✗</span>`
				}));
				return renderSnippet(snippet, {});
			}
		}
	];

	// Műveletek oszlop - csak akkor adjuk hozzá, ha van legalább egy callback
	const actions = [];
	if (onRemoveFromGroup) {
		actions.push({
			label: t('users.groups.actions.removeUser'),
			onClick: (user: UserSelectModel) => onRemoveFromGroup(user),
			variant: 'destructive' as const,
			primary: true
		});
	}
	if (onOpenUser) {
		actions.push({
			label: t('users.users.actions.open'),
			onClick: (user: UserSelectModel) => onOpenUser(user)
		});
	}

	if (actions.length > 0) {
		columns.push(createActionsColumn<UserSelectModel>(actions));
	}

	return columns;
}
