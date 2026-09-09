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
	let triggerEl = $state<HTMLDivElement | undefined>();
	let dropdownTop = $state(0);
	let dropdownLeft = $state(0);
	let dropdownWidth = $state(240);

	let calendarValue = $state<DateValue | undefined>(value ? tryParseDate(value) : undefined);

	function tryParseDate(s: string): DateValue | undefined {
		try {
			return parseDate(s);
		} catch {
			return undefined;
		}
	}

	$effect(() => {
		const next = calendarValue ? calendarValue.toString() : '';
		if (next !== value) {
			value = next;
			if (next) open = false;
		}
	});

	$effect(() => {
		const parsed = value ? tryParseDate(value) : undefined;
		const current = calendarValue ? calendarValue.toString() : '';
		if ((parsed?.toString() ?? '') !== current) {
			calendarValue = parsed;
		}
	});

	function toggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (disabled) return;
		if (!open && triggerEl) {
			const rect = triggerEl.getBoundingClientRect();
			dropdownTop = rect.bottom + 4;
			dropdownLeft = rect.left;
			dropdownWidth = Math.max(rect.width, 240);
		}
		open = !open;
	}

	function closeOnOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.date-picker-root')) {
			open = false;
		}
	}
</script>

<svelte:window onclick={closeOnOutside} />

<div
	bind:this={triggerEl}
	class={cn('date-picker-root', className)}
	style="position: relative; display: inline-block; width: 100%;"
>
	<Button
		variant="outline"
		class={cn(
			'w-full justify-start text-start font-normal',
			!calendarValue && 'text-muted-foreground'
		)}
		{disabled}
		onclick={toggle}
	>
		<CalendarIcon class="me-2 size-4 shrink-0" />
		{calendarValue ? df.format(calendarValue.toDate(getLocalTimeZone())) : placeholder}
	</Button>

	{#if open}
		<div
			class="date-picker-dropdown"
			role="dialog"
			aria-modal="true"
			style="top: {dropdownTop}px; left: {dropdownLeft}px; min-width: {dropdownWidth}px;"
		>
			<Calendar
				type="single"
				{locale}
				bind:value={calendarValue}
				{minValue}
				{maxValue}
				initialFocus
			/>
		</div>
	{/if}
</div>

<style>
	.date-picker-dropdown {
		position: fixed;
		z-index: 9999;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		background: var(--color-popover, white);
		padding: 0;
	}
</style>
