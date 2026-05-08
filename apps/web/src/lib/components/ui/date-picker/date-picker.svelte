<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
		parseDate
	} from '@internationalized/date';
	import { cn } from '$lib/utils/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let {
		value = $bindable(''),
		placeholder = 'Válassz dátumot...',
		locale = 'hu-HU',
		disabled = false,
		class: className = '',
		minValue,
		maxValue
	}: {
		value?: string;
		placeholder?: string;
		locale?: string;
		disabled?: boolean;
		class?: string;
		minValue?: DateValue;
		maxValue?: DateValue;
	} = $props();

	const df = new DateFormatter(locale, { dateStyle: 'long' });

	let open = $state(false);

	// Belső DateValue state — a Calendar bind:value-hoz
	let calendarValue = $state<DateValue | undefined>(value ? tryParseDate(value) : undefined);

	function tryParseDate(s: string): DateValue | undefined {
		try {
			return parseDate(s);
		} catch {
			return undefined;
		}
	}

	// calendarValue változásakor frissítjük a külső string value-t és bezárjuk a popover-t
	$effect(() => {
		const next = calendarValue ? calendarValue.toString() : '';
		if (next !== value) {
			value = next;
			if (next) open = false;
		}
	});

	// Külső value változásakor frissítjük a belső state-et
	$effect(() => {
		const parsed = value ? tryParseDate(value) : undefined;
		const current = calendarValue ? calendarValue.toString() : '';
		if ((parsed?.toString() ?? '') !== current) {
			calendarValue = parsed;
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					'w-full justify-start text-start font-normal',
					!calendarValue && 'text-muted-foreground',
					className
				)}
				{disabled}
				{...props}
			>
				<CalendarIcon class="me-2 size-4 shrink-0" />
				{calendarValue ? df.format(calendarValue.toDate(getLocalTimeZone())) : placeholder}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="z-200 w-auto p-0" align="start">
		<Calendar
			type="single"
			{locale}
			bind:value={calendarValue}
			{minValue}
			{maxValue}
			initialFocus
		/>
	</Popover.Content>
</Popover.Root>
