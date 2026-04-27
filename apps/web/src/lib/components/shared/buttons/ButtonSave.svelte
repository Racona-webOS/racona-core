<!-- ButtonEdit.svelte -->
<script lang="ts">
	import IconButton from './IconButton.svelte';
	import { Save } from 'lucide-svelte';

	interface Props {
		text: string;
		onclick?: () => void;
		disabled?: boolean;
	}

	let { text, onclick, disabled = false }: Props = $props();
</script>

<IconButton {text} {onclick} {disabled}>
	{#snippet icon()}<Save />{/snippet}
</IconButton>
