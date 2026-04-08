<svelte:options customElement="__PLUGIN_ID__-overview" />

<script module>
	if (typeof window !== 'undefined') {
		window.__PLUGIN_ID_UNDERSCORE___Component_Overview = function () {
			return { tagName: '__PLUGIN_ID__-overview' };
		};
	}
</script>

<script lang="ts">
	import type {} from '@elyos-dev/sdk/types';

	let { pluginId = '__PLUGIN_ID__' }: { pluginId?: string } = $props();

	const sdk = $derived(
		(window as any).__webOS_instances?.get(pluginId) ?? (window as any).webOS
	);

	function t(key: string): string {
		return sdk?.i18n?.t(key) ?? key;
	}
</script>

<section>
	<h2>{t('overview.title')}</h2>
	<p>{t('overview.description')}</p>
</section>

<style>
	section {
		padding: 2rem;
	}

	h2 {
		margin-bottom: 0.5rem;
	}

	p {
		color: var(--color-neutral-600, #4b5563);
	}
</style>
