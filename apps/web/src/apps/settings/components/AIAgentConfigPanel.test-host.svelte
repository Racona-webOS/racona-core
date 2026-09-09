<!--
  Teszt host az AIAgentConfigPanel-hez.

  A panel a "Kapcsolat tesztelése" és a "Mentés" gombot nem maga rendereli,
  hanem az ActionBar contextbe teszi (actionBar.set(configActions)) — élesben
  az AppLayout jeleníti meg őket. Ez a host ugyanezt csinálja: létrehozza a
  valódi ActionBar contextet, és kirendereli a panel által beregisztrált
  snippetet, hogy a gombok a tesztekben is elérhetők legyenek.
-->
<script lang="ts">
	import { createActionBar } from '$lib/apps/actionBar.svelte';
	import AIAgentConfigPanel from './AIAgentConfigPanel.svelte';

	const actionBar = createActionBar();
</script>

<AIAgentConfigPanel />

{#if actionBar.content}
	{@render actionBar.content()}
{/if}
