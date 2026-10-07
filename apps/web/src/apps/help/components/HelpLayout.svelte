<!--
  Súgó oldalsávos elrendezés: a tartalomjegyzék a szinkronizált dokumentációból
  épül fel, a menüpontok a HelpPage komponenst töltik be az adott oldallal.
  A nyelv váltásakor az index.svelte újra létrehozza.
-->
<script lang="ts">
	import { AppLayout } from '$lib/components/shared';
	import { createAppShell } from '$lib/apps/appShell.svelte';
	import { untrack } from 'svelte';
	import { buildHelpMenu } from '../utils/helpContent';
	import type { HelpNavigation } from '../types';

	interface Props {
		/** A súgó nyelve. */
		locale: string;
		/** Az ablak eredeti címe, ehhez fűzzük a megnyitott oldal címét. */
		baseTitle: string;
	}

	const props: Props = $props();

	const navigation = $state<HelpNavigation>({});

	const shell = createAppShell({
		appName: 'help',
		// A nyelv változásakor az egész elrendezés újraépül, itt elég a kezdeti érték
		menuData: untrack(() => buildHelpMenu(props.locale)),
		extraProps: () => ({ locale: props.locale, baseTitle: props.baseTitle, navigation })
	});
</script>

<AppLayout {shell} namespaces={['help']} searchable sidebarWidth={260} maxWidthClass="max-w-4xl" />
