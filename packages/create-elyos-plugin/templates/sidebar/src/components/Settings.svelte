<svelte:options customElement="__PLUGIN_ID__-settings" />

<script module>
	if (typeof window !== 'undefined') {
		window.__PLUGIN_ID_UNDERSCORE___Component_Settings = function () {
			return { tagName: '__PLUGIN_ID__-settings' };
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

	let name = $state('');

	async function saveName() {
		if (!name.trim()) {
			sdk?.ui.toast('Name is required', 'warning');
			return;
		}
		await sdk?.data.set('user-name', name);
		sdk?.ui.toast(t('settings.save') + ' ✓', 'success');
	}

</script>

{#if !translationsLoaded}
	<div style="padding: 2rem; text-align: center;">Loading...</div>
{:else}
	<section>
		<h2>{t('settings.title')}</h2>

		<div class="setting-item">
			<label>
				{t('settings.name')}
				<input type="text" bind:value={name} />
			</label>
			<button onclick={saveName}>{t('settings.save')}</button>
		</div>
	</section>
{/if}

<style>
	section {
		padding: 2rem;
	}

	h2 {
		margin-bottom: 1rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 300px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	input {
		border: 1px solid var(--color-neutral-300, #d1d5db);
		border-radius: 0.25rem;
		padding: 0.5rem;
	}

	button {
		cursor: pointer;
		border: 1px solid #ccc;
		border-radius: 0.25rem;
		padding: 0.5rem 1rem;
		width: fit-content;
	}
</style>
