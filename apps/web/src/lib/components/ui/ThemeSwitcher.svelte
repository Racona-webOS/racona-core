<script lang="ts">
	import { getThemeManager } from '$lib/stores';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { browser } from '$app/environment';

	const theme = $derived(browser ? getThemeManager() : null);
	const isDark = $derived(theme?.isDark ?? false);

	async function toggleTheme() {
		if (theme) {
			await theme.setMode(isDark ? 'light' : 'dark');
		}
	}
</script>

{#if browser}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<button
					class="theme-toggle self-center"
					class:dark={isDark}
					onclick={toggleTheme}
					aria-label={isDark ? 'Váltás világos módra' : 'Váltás sötét módra'}
				>
					<!-- Nappali háttér -->
					<svg
						class="bg-day"
						viewBox="0 0 80 36"
						preserveAspectRatio="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<defs>
							<linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#f5c97a" />
								<stop offset="60%" stop-color="#f0956a" />
								<stop offset="100%" stop-color="#d4604a" />
							</linearGradient>
							<linearGradient id="dayHill1" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#c0503a" />
								<stop offset="100%" stop-color="#a03828" />
							</linearGradient>
							<linearGradient id="dayHill2" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#b04535" />
								<stop offset="100%" stop-color="#8a2e20" />
							</linearGradient>
						</defs>
						<rect width="80" height="36" fill="url(#dayGrad)" />
						<!-- nap glowja -->
						<circle cx="64" cy="9" r="10" fill="#fde68a" opacity="0.25" />
						<circle cx="64" cy="9" r="6" fill="#fde68a" opacity="0.5" />
						<!-- dűnék / dombok -->
						<ellipse cx="22" cy="38" rx="30" ry="14" fill="url(#dayHill1)" />
						<ellipse cx="55" cy="40" rx="32" ry="13" fill="url(#dayHill2)" opacity="0.9" />
					</svg>

					<!-- Éjszakai háttér -->
					<svg
						class="bg-night"
						viewBox="0 0 80 36"
						preserveAspectRatio="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<defs>
							<linearGradient id="nightGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#3b1f6e" />
								<stop offset="100%" stop-color="#1a0a3d" />
							</linearGradient>
						</defs>
						<rect width="80" height="36" fill="url(#nightGrad)" />
						<polygon points="0,36 20,16 40,36" fill="#2a1550" opacity="0.8" />
						<polygon points="25,36 50,12 75,36" fill="#1e0e40" opacity="0.9" />
						<!-- hold -->
						<circle cx="18" cy="10" r="6" fill="white" opacity="0.6" />
						<circle cx="21" cy="8" r="5" fill="#2a1550" />
						<!-- csillagok -->
						<circle cx="45" cy="6" r="1" fill="white" opacity="0.8" />
						<circle cx="58" cy="4" r="0.8" fill="white" opacity="0.6" />
						<circle cx="65" cy="12" r="0.7" fill="white" opacity="0.5" />
					</svg>

					<!-- Csúszó gomb -->
					<svg
						class="knob-face"
						viewBox="0 0 18 18"
						xmlns="http://www.w3.org/2000/svg"
						opacity="0.88"
					>
						<defs>
							<linearGradient id="knobGrad" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stop-color="#0d0d12" />
								<stop offset="100%" stop-color="#1e1e28" />
							</linearGradient>
						</defs>
						<circle cx="9" cy="9" r="9" fill="url(#knobGrad)" />
					</svg>
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content>Váltás {isDark ? 'világos' : 'sötét'} módra</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}

<style>
	:global([data-slot='tooltip-trigger']) {
		display: flex;
		align-items: center;
	}

	.theme-toggle {
		display: block;
		position: relative;
		flex-shrink: 0;
		align-self: center;
		transition: border-color 0.4s ease;
		cursor: pointer;
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(0, 0, 0, 0.4);
		border-radius: 999px;
		background: transparent;
		padding: 0;
		width: 52px;
		height: 28px;
		overflow: hidden;
	}

	.bg-day,
	.bg-night {
		position: absolute;
		transition: opacity 0.4s ease;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.bg-day {
		opacity: 1;
	}
	.bg-night {
		opacity: 0;
	}

	.theme-toggle.dark {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.theme-toggle.dark .bg-day {
		opacity: 0;
	}
	.theme-toggle.dark .bg-night {
		opacity: 1;
	}

	.knob-face {
		display: block;
		position: absolute;
		top: 50%;
		left: 0px;
		transform: translateY(-50%) translateX(0);
		opacity: 0.65;
		z-index: 2;
		transition:
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.4s ease;
		box-shadow:
			0 0 0 2px rgba(0, 0, 0, 0.5),
			0 0 0 4px rgba(0, 0, 0, 0.2);
		border-radius: 50%;
		width: 22px;
		height: 22px;
	}

	.theme-toggle.dark .knob-face {
		transform: translateY(-50%) translateX(26px);
		opacity: 0.78;
	}
</style>
