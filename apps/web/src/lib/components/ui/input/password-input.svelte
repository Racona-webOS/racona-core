<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils/index.js';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';

	type Props = WithElementRef<Omit<HTMLInputAttributes, 'type'>>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();

	let showPassword = $state(false);
</script>

<div class="relative">
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 pr-9 text-base shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
			className
		)}
		type={showPassword ? 'text' : 'password'}
		bind:value
		{...restProps}
	/>
	<button
		type="button"
		tabindex="-1"
		aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
		class="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
		onclick={() => (showPassword = !showPassword)}
	>
		{#if showPassword}
			<EyeOff class="h-4 w-4" />
		{:else}
			<Eye class="h-4 w-4" />
		{/if}
	</button>
</div>
