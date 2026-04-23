<script lang="ts">
	import type { RawMenuItem } from '$lib/types/menu';
	import { AppLayout } from '$lib/components/shared';
	import { createAppShell } from '$lib/apps/appShell.svelte';
	import { getContext } from 'svelte';
	import menuData from './menu.json';

	const settings = getContext('settings');

	const shell = createAppShell({
		appName: 'settings',
		menuData: menuData as RawMenuItem[],
		extraProps: () => ({ data: { settings } })
	});
</script>

<AppLayout {shell} namespaces={['settings']} searchable sidebarWidth={300} />
