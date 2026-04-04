<!--
  Plugin Layout Wrapper

  Ez a komponens wrapper az AppLayout körül plugin esetén.
  Létrehozza a shell-t a megfelelő kontextusban.
-->
<script lang="ts">
	import { createAppShell } from '$lib/apps/appShell.svelte';
	import AppLayout from './AppLayout.svelte';
	import type { RawMenuItem } from '$lib/types/menu';

	interface Props {
		pluginId: string;
		menuData: RawMenuItem[];
	}

	let { pluginId, menuData }: Props = $props();

	// Shell létrehozása komponens kontextusban - csak egyszer
	// A pluginId és menuData nem változik a komponens életciklusa alatt
	const shell = createAppShell({
		appName: pluginId,
		menuData: menuData,
		isPlugin: true
	});

	// De a namespace-t plugin:pluginId-re állítjuk a fordításokhoz
	const pluginNamespace = `plugin:${pluginId}`;
</script>

<AppLayout {shell} namespaces={[pluginNamespace]} isPlugin={true} searchable={true} />
