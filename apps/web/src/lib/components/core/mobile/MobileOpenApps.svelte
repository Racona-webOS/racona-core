<!--
 A megnyitott appok listája (a tálca helyett): koppintásra az app teljes képernyőn
 nyílik meg, a bezárás gombbal az app bezárul.
 -->
<script lang="ts">
	import { X } from 'lucide-svelte';
	import { getWindowManager } from '$lib/stores';
	import { UniversalIcon } from '$lib/components/shared';
	import { useI18n } from '$lib/i18n/hooks';

	let { onShow }: { onShow: (windowId: string) => void } = $props();

	const { t } = useI18n();
	const windowManager = getWindowManager();

	// A legutóbb használt elöl
	const windows = $derived([...windowManager.windows].sort((a, b) => b.zIndex - a.zIndex));

	function close(id: string) {
		windowManager.closeWindow(id);
		windowManager.deactivateAllWindows();
	}
</script>

{#if windows.length === 0}
	<p class="mobile-empty">{t('desktop.mobile.openApps.empty')}</p>
{:else}
	<ul class="open-apps">
		{#each windows as windowState (windowState.id)}
			<li class="open-app">
				<button class="open-app-main" onclick={() => onShow(windowState.id)}>
					<span class="open-app-icon">
						<UniversalIcon icon={windowState.icon ?? ''} size={22} appName={windowState.appName} />
					</span>
					<span class="open-app-title">{windowState.title}</span>
				</button>
				<button
					class="open-app-close"
					onclick={() => close(windowState.id)}
					aria-label={t('desktop.mobile.close')}
				>
					<X class="size-5" />
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.mobile-empty {
		padding: 3rem 1.5rem;
		color: var(--muted-foreground);
		text-align: center;
	}

	.open-apps {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.open-app {
		display: flex;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 0.875rem;
		background: var(--card);
	}

	.open-app-main {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		min-width: 0;
		text-align: left;
	}

	.open-app-icon {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: 0.625rem;
		background: var(--muted);
		width: 2.5rem;
		height: 2.5rem;
	}

	.open-app-title {
		overflow: hidden;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.open-app-close {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		width: 3rem;
		height: 3rem;
		color: var(--muted-foreground);
	}
</style>
