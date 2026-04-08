<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from 'bits-ui';
	import { Image } from 'lucide-svelte';
	import { APP_CONSTANTS } from '$lib/constants';
	import { toast } from 'svelte-sonner';
	import { updateSettings } from '../settings.remote';
	import { getContext } from 'svelte';
	import { invalidate } from '$app/navigation';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { useI18n } from '$lib/i18n/hooks';

	// Settings objektum a kontextusból - ez már reaktív a layout miatt
	const settings = getContext<{
		preferPerformance: boolean;
		windowPreview: boolean;
		screenshotThumbnailHeight: number;
	}>('settings');

	// i18n
	const { t } = useI18n();

	// Számított értékek
	let isWindowPreviewDisabled = $derived(settings.preferPerformance);
	let isScreenshotHeightDisabled = $derived(settings.preferPerformance || !settings.windowPreview);

	async function handlePreferPerformanceChange() {
		const newValue = !settings.preferPerformance;
		try {
			const result = await updateSettings({ preferPerformance: newValue });
			if (result && 'success' in result && result.success) {
				// Frissítjük az oldalt, hogy a settings újratöltődjön
				await invalidate('app:settings');
				toast.success(t('settings.performance.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Settings update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	async function handleWindowPreviewChange() {
		if (isWindowPreviewDisabled) return;
		const newValue = !settings.windowPreview;
		try {
			const result = await updateSettings({ windowPreview: newValue });
			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				console.log('Settings updated successfully');
				toast.success(t('settings.performance.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Settings update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	const thumbnailHeights = [100, 150, 200];

	// Icon méret meghatározása az érték alapján
	function getIconSize(value: number): number {
		const index = thumbnailHeights.indexOf(value);
		const sizes = [14, 18, 22]; // Növekvő méretek
		return sizes[index] ?? 18;
	}

	// Szöveges címke meghatározása az érték alapján
	function getLabel(value: number): string {
		const index = thumbnailHeights.indexOf(value);
		const keys = ['small', 'medium', 'large'];
		return t(`settings.performance.previewSize.${keys[index]}`);
	}

	// Csak akkor mentünk, amikor a felhasználó befejezi a slider mozgatását
	async function handleScreenshotHeightCommit(newValue: number) {
		if (isScreenshotHeightDisabled) return;

		try {
			const result = await updateSettings({
				screenshotThumbnailHeight: newValue
			});
			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				console.log('Settings updated successfully');
				toast.success(t('settings.performance.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Settings update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}
</script>

<h2>{t('settings.performance.title')}</h2>

<!-- Teljesítmény optimalizálás-->
<ContentSection
	title={t('settings.performance.optimization.label')}
	description={t('settings.performance.optimization.description')}
>
	{#snippet info()}
		{t('settings.performance.optimization.info')}
	{/snippet}

	<Switch
		id="prefer-performance"
		checked={settings.preferPerformance}
		onclick={handlePreferPerformanceChange}
	/>
</ContentSection>

{#if !settings.preferPerformance}
	<!-- Ablak előnézet -->
	<ContentSection
		title={t('settings.performance.windowPreview.label')}
		description={t('settings.performance.windowPreview.description')}
		disabled={isWindowPreviewDisabled}
	>
		{#snippet info()}
			{t('settings.performance.windowPreview.info')}
		{/snippet}

		<Switch
			id="window-preview"
			checked={settings.windowPreview}
			disabled={isWindowPreviewDisabled}
			onclick={handleWindowPreviewChange}
		/>
	</ContentSection>

	<!-- Előnézeti kép magassága -->
	<ContentSection
		title={t('settings.performance.previewSize.label')}
		description={t('settings.performance.previewSize.description')}
		disabled={isScreenshotHeightDisabled}
		contentPosition="bottom"
	>
		{#snippet info()}
			{t('settings.performance.previewSize.info')}
		{/snippet}

		<div class="slider-container">
			<Slider.Root
				type="single"
				step={thumbnailHeights}
				value={settings.screenshotThumbnailHeight}
				disabled={isScreenshotHeightDisabled}
				onValueCommit={(value) => handleScreenshotHeightCommit(value)}
				class="slider-root"
				trackPadding={3}
			>
				{#snippet children({ tickItems })}
					<span class="slider-track">
						<Slider.Range class="slider-range" />
					</span>
					<Slider.Thumb index={0} class="slider-thumb" />
					{#each tickItems as { index, value } (index)}
						<Slider.Tick {index} class="slider-tick" />
						<Slider.TickLabel {index} class="slider-tick-label">
							<div class="tick-content">
								<Image size={getIconSize(value)} strokeWidth={2} />
								<span class="tick-text">{getLabel(value)}</span>
							</div>
						</Slider.TickLabel>
					{/each}
				{/snippet}
			</Slider.Root>
		</div>
	</ContentSection>
{/if}

<style>
	.slider-container {
		margin-top: 4rem;
		padding: 0 0.5rem;
		width: 100%;
	}

	.slider-container :global(.slider-root) {
		display: flex;
		position: relative;
		align-items: center;
		width: 100%;
		touch-action: none;
		user-select: none;
	}

	.slider-container :global(.slider-track) {
		position: relative;
		flex-grow: 1;
		cursor: pointer;
		border-radius: 9999px;
		background-color: var(--color-muted);
		width: 100%;
		height: 0.5rem;
		overflow: hidden;
	}

	.slider-container :global(.slider-range) {
		position: absolute;
		background-color: var(--color-foreground);
		height: 100%;
	}

	.slider-container :global(.slider-thumb) {
		display: block;
		z-index: 10;
		transition: all 0.2s;
		cursor: pointer;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		border: 2px solid var(--color-foreground);
		border-radius: 9999px;
		background-color: white;
		width: 20px;
		height: 20px;
	}

	.slider-container :global(.slider-thumb:hover) {
		box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
	}

	.slider-container :global(.slider-thumb:focus-visible) {
		outline: none;
		box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.2);
	}

	.slider-container :global(.slider-thumb[data-disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	.slider-container :global(.slider-tick) {
		z-index: 1;
		background-color: var(--color-background);
		width: 1px;
		height: 0.5rem;
	}

	:global(.dark) .slider-container :global(.slider-tick) {
		background-color: var(--color-background);
	}

	.slider-container :global(.slider-tick-label) {
		margin-bottom: 1.25rem;
		color: var(--color-muted-foreground);
		font-weight: 500;
		font-size: 0.875rem;
		line-height: 1;
	}

	.slider-container :global(.slider-tick-label[data-selected]) {
		color: var(--color-foreground);
	}

	.slider-container :global(.tick-content) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.slider-container :global(.tick-text) {
		font-size: 0.75rem;
		white-space: nowrap;
	}
</style>
