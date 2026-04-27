<!-- IconButton.svelte -->
<script lang="ts">
	import { Button, type ButtonVariant } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		icon: Snippet;
		variant?: ButtonVariant;
		onclick?: () => void;
		disabled?: boolean;
	}

	let { text, icon, onclick, variant = 'default', disabled = false }: Props = $props();
</script>

<Button {variant} size="sm" {onclick} {disabled}>
	{@render icon()}{text}
</Button>
