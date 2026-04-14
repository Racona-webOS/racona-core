import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import {
	DataTableColumnHeader,
	renderComponent,
	renderSnippet,
	createActionsColumn
} from '$lib/components/ui/data-table';
import type { ColumnDeps } from '$lib/components/ui/data-table';
import type { Notification } from '@racona/database';

interface NotificationColumnDeps extends ColumnDeps {
	locale: string;
	onOpen: (notification: Notification) => void;
	onDelete: (notification: Notification) => void;
	onMarkAsRead: (notification: Notification) => void;
}

function resolveLocalizedText(
	value: Record<string, string> | string | null | undefined,
	locale: string
): string {
	if (!value) return '—';
	if (typeof value === 'string') return value;
	if (typeof value !== 'object') return '—';
	if (value[locale]) return value[locale];
	if (value['en']) return value['en'];
	const keys = Object.keys(value);
	return keys.length > 0 ? value[keys[0]] : '—';
}

export function createColumns(deps: NotificationColumnDeps): ColumnDef<Notification, unknown>[] {
	const { t, onSort, locale, onOpen, onDelete, onMarkAsRead } = deps;

	return [
		{
			accessorKey: 'type',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('notifications.list.columns.type');
					},
					onSort
				}),
			cell: ({ row }) => {
				const type = row.original.type;
				const snippet = createRawSnippet(() => ({
					render: () => `<span class="font-medium">${type}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'title',
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('notifications.list.columns.title');
					},
					onSort
				}),
			cell: ({ row }) => {
				const title = resolveLocalizedText(row.original.title as any, locale);
				const escaped = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				const snippet = createRawSnippet(() => ({
					render: () => `<span class="font-medium">${escaped}</span>`
				}));
				return renderSnippet(snippet, {});
			}
		},
		{
			accessorKey: 'message',
			enableSorting: false,
			enableHiding: true,
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					get column() {
						return column;
					},
					get title() {
						return t('notifications.list.columns.message');
					}
				}),
			cell: ({ row }) => {
				const message = resolveLocalizedText(row.original.message as any, locale);
				const escaped = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
						return t('notifications.list.columns.createdAt');
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
		createActionsColumn<Notification>((notification) => [
			{
				label: t('notifications.list.actions.open'),
				onClick: () => onOpen(notification),
				primary: true
			},
			...(notification.isRead
				? []
				: [
						{
							label: t('notifications.list.actions.markAsRead'),
							onClick: () => onMarkAsRead(notification)
						}
					]),
			{
				label: t('notifications.list.actions.delete'),
				onClick: () => onDelete(notification),
				variant: 'destructive' as const
			}
		])
	];
}

export { resolveLocalizedText };
