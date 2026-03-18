<svelte:options customElement="__PLUGIN_ID__-overview" />

<script module>
	if (typeof window !== 'undefined') {
		window.__PLUGIN_ID_UNDERSCORE___Component_Overview = function () {
			return { tagName: '__PLUGIN_ID__-overview' };
		};
	}
</script>

<script lang="ts">
	import type {} from '@elyos/sdk/types';

	let { pluginId = '__PLUGIN_ID__' }: { pluginId?: string } = $props();

	let sdk = $derived.by(() => {
		const instances = (window as any).__webOS_instances;
		return instances?.get(pluginId) || (window as any).webOS;
	});

	let translationsLoaded = $state(false);

	$effect(() => {
		if (sdk?.i18n) {
			const checkLoaded = async () => {
				await sdk.i18n.ready();
				translationsLoaded = true;
			};
			checkLoaded();
		}
	});

	function t(key: string): string {
		return sdk?.i18n?.t(key) ?? key;
	}
</script>

{#if !translationsLoaded}
	<div style="padding: 2rem; text-align: center;">Loading...</div>
{:else}
	<section>
		<h2>{t('overview.title')}</h2>
		<p>{t('overview.description')}</p>
	</section>
{/if}

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
