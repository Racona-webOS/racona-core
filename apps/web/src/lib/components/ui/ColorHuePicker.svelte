<script lang="ts">
	/**
	 * ColorHuePicker Component
	 *
	 * A reusable component for selecting color hues from predefined options
	 * or creating custom colors using a hue slider (0-360).
	 *
	 * @component
	 */

	import * as Popover from '$lib/components/ui/popover';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	// Props interface
	interface ColorHuePickerProps {
		currentHue: number;
		onHueChange: (hue: number) => void;
	}

	let { currentHue, onHueChange }: ColorHuePickerProps = $props();

	// Internal state using Svelte 5 runes
	let customHue = $state<number>(260);
	let isPopoverOpen = $state<boolean>(false);

	// Predefined colors array
	const PREDEFINED_COLORS = [
		{ label: 'Kék', hue: 250 },
		{ label: 'Zöld', hue: 150 },
		{ label: 'Lila', hue: 280 },
		{ label: 'Narancs', hue: 50 },
		{ label: 'Piros', hue: 15 },
		{ label: 'Rózsaszín', hue: 340 }
	];

	// Effect to sync customHue with currentHue when it's not a predefined color
	$effect(() => {
		const isPredefined = PREDEFINED_COLORS.some((color) => color.hue === currentHue);
		if (!isPredefined) {
			customHue = currentHue;
		}
	});

	/**
	 * Generate OKLCH color CSS string for a given hue value
	 * Uses the same lightness and chroma as the system's --primary color
	 * @param hue - Hue value (0-360)
	 * @returns CSS color string in OKLCH format
	 */
	function getColorStyle(hue: number): string {
		// Use CSS custom property with the hue value to match system colors
		return `oklch(from var(--primary) l c ${hue})`;
	}

	/**
	 * Check if a hue value matches the current hue (active state)
	 * @param hue - Hue value to check
	 * @returns True if the hue matches the current hue
	 */
	function isActive(hue: number): boolean {
		return currentHue === hue;
	}

	/**
	 * Check if the current hue is a custom value (not in predefined colors)
	 * @returns True if the current hue is custom
	 */
	function isCustomActive(): boolean {
		return !PREDEFINED_COLORS.some((color) => color.hue === currentHue);
	}

	/**
	 * Handle click on a predefined color swatch
	 * @param hue - The hue value of the clicked color
	 */
	function handlePredefinedColorClick(hue: number): void {
		onHueChange(hue);
	}

	/**
	 * Handle custom hue slider change
	 * @param event - Input event from the slider
	 */
	function handleCustomHueChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		customHue = parseInt(target.value, 10);
	}

	/**
	 * Apply the custom hue selection
	 */
	function applyCustomHue(): void {
		onHueChange(customHue);
		isPopoverOpen = false;
	}

	/**
	 * Handle keyboard events for predefined color swatches
	 * @param event - Keyboard event
	 * @param hue - The hue value of the swatch
	 */
	function handleSwatchKeydown(event: KeyboardEvent, hue: number): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handlePredefinedColorClick(hue);
		}
	}
</script>

<div class="color-hue-picker">
	<div class="color-swatches">
		{#each PREDEFINED_COLORS as color}
			<button
				class="color-swatch"
				class:active={isActive(color.hue)}
				style="background-color: {getColorStyle(color.hue)}"
				aria-label={color.label}
				type="button"
				onclick={() => handlePredefinedColorClick(color.hue)}
				onkeydown={(e) => handleSwatchKeydown(e, color.hue)}
				tabindex="0"
			>
				{#if isActive(color.hue)}
					<span class="checkmark">✓</span>
				{/if}
			</button>
		{/each}

		<!-- Custom color swatch with popover -->
		<Popover.Root bind:open={isPopoverOpen}>
			<Popover.Trigger
				class="color-swatch custom-swatch {isCustomActive() ? 'active' : 'inactive'}"
				style="background-color: {isCustomActive()
					? getColorStyle(customHue)
					: 'var(--color-muted)'}"
				aria-label="Custom color"
				type="button"
			>
				{#if isCustomActive()}
					<span class="checkmark">✓</span>
				{/if}
			</Popover.Trigger>
			<Popover.Content class="color-picker-popover" align="start" side="top" sideOffset={8}>
				<div class="custom-hue-picker">
					<div class="slider-container">
						<label for="hue-slider" class="slider-label">{t('common.colorPicker.hue')}</label>
						<div class="slider-row">
							<input
								id="hue-slider"
								type="range"
								min="0"
								max="360"
								step="1"
								value={customHue}
								oninput={handleCustomHueChange}
								aria-label="Hue slider"
								class="hue-slider"
							/>
							<span class="hue-value">{customHue}°</span>
						</div>
					</div>
					<div class="preview-container">
						<div class="preview-swatch" style="background-color: {getColorStyle(customHue)}"></div>
						<span class="preview-label">{t('common.colorPicker.preview')}</span>
					</div>
					<button type="button" class="apply-button" onclick={applyCustomHue}
						>{t('common.colorPicker.apply')}</button
					>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>

<style>
	.color-hue-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.color-swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.color-swatch {
		display: flex;
		position: relative;
		justify-content: center;
		align-items: center;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		cursor: pointer;
		border: 3px solid transparent;
		border-radius: 50%;
		padding: 0;
		width: 40px;
		height: 40px;
	}

	.color-swatch:hover {
		border-color: rgba(0, 0, 0, 0.3);
	}

	:global(.dark) .color-swatch:hover {
		border-color: rgba(255, 255, 255, 0.3);
	}

	.color-swatch:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.color-swatch:focus:not(:focus-visible) {
		outline: none;
	}

	.color-swatch.active {
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
		border-color: rgba(0, 0, 0, 0.5);
	}

	:global(.dark) .color-swatch.active {
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.6);
	}

	.checkmark {
		transition: opacity 0.2s ease;
		color: white;
		font-weight: bold;
		font-size: 20px;
		text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
	}

	/* Custom swatch specific styles */
	:global(.custom-swatch) {
		display: flex;
		position: relative;
		justify-content: center;
		align-items: center;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		cursor: pointer;
		border: 3px solid transparent;
		border-radius: 50%;
		padding: 0;
		width: 40px;
		height: 40px;
	}

	:global(.custom-swatch:hover) {
		border-color: rgba(0, 0, 0, 0.3);
	}

	:global(.dark .custom-swatch:hover) {
		border-color: rgba(255, 255, 255, 0.3);
	}

	:global(.custom-swatch:focus) {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	:global(.custom-swatch:focus:not(:focus-visible)) {
		outline: none;
	}

	:global(.custom-swatch.active) {
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
		border-color: rgba(0, 0, 0, 0.5);
	}

	:global(.dark .custom-swatch.active) {
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.6);
	}

	:global(.custom-swatch.inactive) {
		border: 2px dashed rgba(0, 0, 0, 0.2);
	}

	:global(.dark .custom-swatch.inactive) {
		border: 2px dashed rgba(255, 255, 255, 0.2);
	}

	:global(.custom-swatch::after) {
		display: flex;
		position: absolute;
		right: -4px;
		bottom: -4px;
		justify-content: center;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		border-radius: 50%;
		background-color: var(--primary);
		padding-bottom: 2px;
		width: 20px;
		height: 20px;
		content: '+';
		color: white;
		font-weight: bold;
		font-size: 18px;
		line-height: 1;
	}

	:global(.dark .custom-swatch::after) {
		border-color: var(--color-neutral-800);
	}

	/* Popover content styles */
	:global(.color-picker-popover) {
		z-index: 9999 !important;
		padding: 1rem !important;
		width: auto !important;
		max-width: 320px !important;
	}

	.custom-hue-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-label {
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.hue-slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		border-radius: 4px;
		background: linear-gradient(
			to right,
			hsl(0, 100%, 50%),
			hsl(60, 100%, 50%),
			hsl(120, 100%, 50%),
			hsl(180, 100%, 50%),
			hsl(240, 100%, 50%),
			hsl(300, 100%, 50%),
			hsl(360, 100%, 50%)
		);
		height: 8px;
	}

	.hue-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		border: 2px solid #333;
		border-radius: 50%;
		background: white;
		width: 18px;
		height: 18px;
	}

	.hue-slider::-moz-range-thumb {
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		border: 2px solid #333;
		border-radius: 50%;
		background: white;
		width: 18px;
		height: 18px;
	}

	.hue-value {
		min-width: 40px;
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.875rem;
		text-align: right;
	}

	.preview-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.preview-swatch {
		transition: background-color 0.2s ease;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-radius: 50%;
		width: 48px;
		height: 48px;
	}

	.preview-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.apply-button {
		transition:
			transform 0.2s ease,
			opacity 0.2s ease,
			background-color 0.2s ease;
		cursor: pointer;
		border: none;
		border-radius: 6px;
		background-color: var(--primary);
		padding: 0.5rem 1rem;
		color: white;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.apply-button:hover {
		transform: translateY(-1px);
		opacity: 0.9;
	}

	.apply-button:active {
		transform: translateY(0);
	}

	.apply-button:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.apply-button:focus:not(:focus-visible) {
		outline: none;
	}

	/* Responsive design for smaller screens */
	@media (max-width: 640px) {
		.color-swatches {
			gap: 0.5rem;
		}

		.color-swatch,
		:global(.custom-swatch) {
			width: 36px;
			height: 36px;
		}

		.custom-hue-picker {
			min-width: 200px;
		}
	}
</style>
