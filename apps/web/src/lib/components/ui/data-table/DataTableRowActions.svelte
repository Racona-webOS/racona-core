<script lang="ts" generics="TData">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import type { RowAction } from './actions-column';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	interface Props {
		actions: RowAction<TData>[];
		row: TData;
	}

	let { actions, row }: Props = $props();

	const primaryAction = $derived(actions.find((a) => a.primary) ?? actions[0]);
	const secondaryActions = $derived(actions.filter((a) => a !== primaryAction));
</script>

{#if actions.length === 0}
	<!-- nincs művelet -->
{:else if actions.length === 1}
	<Button
		variant={primaryAction.variant === 'destructive' ? 'destructive' : 'outline'}
		size="sm"
		class="h-7 text-xs"
		onclick={() => primaryAction.onClick(row)}
	>
		{primaryAction.label}
	</Button>
{:else}
	<div class="inline-flex items-center rounded-md shadow-xs">
		<Button
			variant="outline"
			size="sm"
			class="h-7 rounded-r-none border-r-0 text-xs"
			onclick={() => primaryAction.onClick(row)}
		>
			{primaryAction.label}
		</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="icon" class="h-7 w-7 rounded-l-none">
						<EllipsisVertical class="size-3.5" />
						<span class="sr-only">{t('common.dataTable.rowActions')}</span>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="z-1000">
				{#each secondaryActions as action (action.label)}
					{#if action.separator}
						<DropdownMenu.Separator />
					{/if}
					<DropdownMenu.Item
						variant={action.variant ?? 'default'}
						onclick={() => action.onClick(row)}
					>
						{action.label}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/if}
