<script lang="ts">
	/**
	 * ColorPicker Component
	 *
	 * A reusable component for selecting colors from predefined options
	 * or creating custom colors using RGB sliders.
	 *
	 * @component
	 */

	import * as Popover from '$lib/components/ui/popover';
	import T from '$lib/i18n/components/T.svelte';

	// Props interface
	interface ColorPickerProps {
		currentColor: string;
		onColorChange: (color: string) => void;
	}

	let { currentColor, onColorChange }: ColorPickerProps = $props();

	// Internal state using Svelte 5 runes
	let customColor = $state<string>('#1e293b');
	let isPopoverOpen = $state<boolean>(false);
	let r = $state<number>(30);
	let g = $state<number>(41);
	let b = $state<number>(59);

	// Predefined colors array
	const PREDEFINED_COLORS = [
		{ label: 'Sötétkék', color: '#1e293b' },
		{ label: 'Fekete', color: '#000000' },
		{ label: 'Szürke', color: '#6b7280' },
		{ label: 'Zöld', color: '#059669' },
		{ label: 'Lila', color: '#7c3aed' },
		{ label: 'Piros', color: '#dc2626' }
	];

	// Helper function to convert hex to RGB
	function hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: { r: 30, g: 41, b: 59 };
	}

	// Helper function to convert RGB to hex
	function rgbToHex(r: number, g: number, b: number): string {
		return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
	}

	// Effect to sync customColor with currentColor when it's not a predefined color
	$effect(() => {
		const isPredefined = PREDEFINED_COLORS.some((color) => color.color === currentColor);
		if (!isPredefined) {
			customColor = currentColor;
			const rgb = hexToRgb(currentColor);
			r = rgb.r;
			g = rgb.g;
			b = rgb.b;
		}
	});

	// Effect to update customColor when RGB values change
	$effect(() => {
		customColor = rgbToHex(r, g, b);
	});

	/**
	 * Check if a color value matches the current color (active state)
	 * @param color - Color value to check
	 * @returns True if the color matches the current color
	 */
	function isActive(color: string): boolean {
		return currentColor === color;
	}

	/**
	 * Check if the current color is a custom value (not in predefined colors)
	 * @returns True if the current color is custom
	 */
	function isCustomActive(): boolean {
		return !PREDEFINED_COLORS.some((color) => color.color === currentColor);
	}

	/**
	 * Handle click on a predefined color swatch
	 * @param color - The color value of the clicked swatch
	 */
	function handlePredefinedColorClick(color: string): void {
		onColorChange(color);
	}

	/**
	 * Apply the custom color selection
	 */
	function applyCustomColor(): void {
		onColorChange(customColor);
		isPopoverOpen = false;
	}

	/**
	 * Handle RGB slider changes
	 */
	function handleRChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		r = parseInt(target.value, 10);
	}

	function handleGChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		g = parseInt(target.value, 10);
	}

	function handleBChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		b = parseInt(target.value, 10);
	}

	/**
	 * Handle keyboard events for predefined color swatches
	 * @param event - Keyboard event
	 * @param color - The color value of the swatch
	 */
	function handleSwatchKeydown(event: KeyboardEvent, color: string): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handlePredefinedColorClick(color);
		}
	}
</script>

<div class="color-picker">
	<div class="color-swatches">
		{#each PREDEFINED_COLORS as color}
			<button
				class="color-swatch"
				class:active={isActive(color.color)}
				style="background-color: {color.color}"
				aria-label={color.label}
				type="button"
				onclick={() => handlePredefinedColorClick(color.color)}
				onkeydown={(e) => handleSwatchKeydown(e, color.color)}
				tabindex="0"
			>
				{#if isActive(color.color)}
					<span class="checkmark">✓</span>
				{/if}
			</button>
		{/each}

		<!-- Custom color swatch with popover -->
		<Popover.Root bind:open={isPopoverOpen}>
			<Popover.Trigger
				class="color-swatch custom-swatch {isCustomActive() ? 'active' : 'inactive'}"
				style="background-color: {isCustomActive() ? customColor : 'var(--color-muted)'}"
				aria-label="Egyedi szín"
				type="button"
			>
				{#if isCustomActive()}
					<span class="checkmark">✓</span>
				{/if}
			</Popover.Trigger>
			<Popover.Content class="color-picker-popover" align="start" side="top" sideOffset={8}>
				<div class="custom-color-picker">
					<div class="color-mixer">
						<div class="preview-large" style="background-color: {customColor}"></div>

						<div class="slider-group">
							<div class="slider-row">
								<label for="r-slider" class="slider-label">
									<span class="color-badge red">R</span>
									<span class="slider-value">{r}</span>
								</label>
								<input
									id="r-slider"
									type="range"
									min="0"
									max="255"
									step="1"
									value={r}
									oninput={handleRChange}
									class="color-slider red-slider"
								/>
							</div>

							<div class="slider-row">
								<label for="g-slider" class="slider-label">
									<span class="color-badge green">G</span>
									<span class="slider-value">{g}</span>
								</label>
								<input
									id="g-slider"
									type="range"
									min="0"
									max="255"
									step="1"
									value={g}
									oninput={handleGChange}
									class="color-slider green-slider"
								/>
							</div>

							<div class="slider-row">
								<label for="b-slider" class="slider-label">
									<span class="color-badge blue">B</span>
									<span class="slider-value">{b}</span>
								</label>
								<input
									id="b-slider"
									type="range"
									min="0"
									max="255"
									step="1"
									value={b}
									oninput={handleBChange}
									class="color-slider blue-slider"
								/>
							</div>
						</div>

						<div class="hex-display">
							<span class="hex-label">HEX:</span>
							<span class="hex-value">{customColor.toUpperCase()}</span>
						</div>
					</div>

					<button type="button" class="apply-button" onclick={applyCustomColor}
						><T key="common.colorPicker.apply" /></button
					>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>

<style>
	.color-picker {
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
		padding: 1.25rem !important;
		width: auto !important;
		min-width: 280px !important;
	}

	.custom-color-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.color-mixer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.preview-large {
		transition: background-color 0.15s ease;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-md, 0.375rem);
		width: 100%;
		height: 80px;
	}

	:global(.dark) .preview-large {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slider-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.color-badge {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border-radius: 4px;
		padding: 2px 8px;
		min-width: 32px;
		color: white;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.color-badge.red {
		background-color: #ef4444;
	}

	.color-badge.green {
		background-color: #10b981;
	}

	.color-badge.blue {
		background-color: #3b82f6;
	}

	.slider-value {
		min-width: 36px;
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.875rem;
		text-align: right;
	}

	.color-slider {
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		border-radius: 4px;
		width: 100%;
		height: 8px;
	}

	.red-slider {
		background: linear-gradient(to right, #000000, #ff0000);
	}

	.green-slider {
		background: linear-gradient(to right, #000000, #00ff00);
	}

	.blue-slider {
		background: linear-gradient(to right, #000000, #0000ff);
	}

	.color-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		border-radius: 50%;
		background: var(--color-neutral-700);
		width: 18px;
		height: 18px;
	}

	:global(.dark) .color-slider::-webkit-slider-thumb {
		background: var(--color-neutral-300);
	}

	.color-slider::-moz-range-thumb {
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		border-radius: 50%;
		background: var(--color-neutral-700);
		width: 18px;
		height: 18px;
	}

	:global(.dark) .color-slider::-moz-range-thumb {
		background: var(--color-neutral-300);
	}

	.hex-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid var(--color-neutral-200);
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-neutral-50);
		padding: 0.625rem 0.875rem;
	}

	:global(.dark) .hex-display {
		border-color: var(--color-neutral-700);
		background-color: var(--color-neutral-800);
	}

	.hex-label {
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.75rem;
	}

	.hex-value {
		color: var(--text-primary);
		font-weight: 600;
		font-size: 0.875rem;
		font-family: monospace;
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
		padding: 0.625rem 1rem;
		width: 100%;
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
	}
</style>
