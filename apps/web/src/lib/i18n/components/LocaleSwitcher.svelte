<script lang="ts">
	/**
	 * LocaleSwitcher Component
	 *
	 * Nyelvválasztó komponens több megjelenítési variánssal.
	 * Támogatja a dropdown, buttons és flags megjelenítést.
	 * Ha csak egy nyelv támogatott, nem jelenik meg.
	 *
	 * Requirements: 5.5
	 *
	 * @example
	 * <!-- Dropdown variáns (alapértelmezett) -->
	 * <LocaleSwitcher />
	 *
	 * <!-- Gombok variáns -->
	 * <LocaleSwitcher variant="buttons" />
	 *
	 * <!-- Zászlók variáns -->
	 * <LocaleSwitcher variant="flags" />
	 */

	import Globe from 'lucide-svelte/icons/globe';
	import Check from 'lucide-svelte/icons/check';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { getI18nService } from '../service.js';
	import { getTranslationStore } from '../store.svelte.js';
	import { setLocalePreference } from '../preference.remote.js';
	import { withTimeout } from '$lib/utils/remote';
	import { invalidate } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { LocaleConfig } from '../types.js';
	import { getClientAppRegistry } from '$lib/services/client/appRegistry';
	import { getWindowManager } from '$lib/stores';
	import { useI18n } from '../hooks.js';

	/**
	 * Props for the LocaleSwitcher component
	 */
	interface Props {
		/** Display variant */
		variant?: 'dropdown' | 'buttons' | 'flags';
		/** Whether to show the full language name */
		showFullName?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Button variant for dropdown trigger */
		buttonVariant?: 'default' | 'ghost' | 'outline';
		/** Button size */
		size?: 'default' | 'sm' | 'icon';
	}

	let {
		variant = 'dropdown',
		showFullName = false,
		class: className = '',
		buttonVariant = 'ghost',
		size = 'sm'
	}: Props = $props();

	// Get the i18n service and store
	const i18nService = getI18nService();
	const store = getTranslationStore();
	const appRegistry = getClientAppRegistry();
	const windowManager = getWindowManager();
	const { t } = useI18n();

	// Popover open state (for dropdown variant)
	let open = $state(false);

	// Loading state for save operation
	let isSaving = $state(false);

	// Reactive current locale from store
	let currentLocale = $derived(store.currentLocale);
	let supportedLocales = $derived(store.supportedLocales);
	let currentLocaleConfig = $derived(
		supportedLocales.find((l: LocaleConfig) => l.code === currentLocale)
	);
	let isLoading = $derived(store.loading || isSaving);
	let showSwitcher = $derived(supportedLocales.length > 1);

	/**
	 * Handle language selection
	 * @param locale - The selected locale code
	 */
	async function handleLocaleChange(locale: string) {
		if (locale === currentLocale || isSaving) return;

		isSaving = true;
		try {
			// Mentés az adatbázisba/cookie-ba a remote function-nel
			const result = await withTimeout(setLocalePreference({ locale }));

			if (result && result.success) {
				// Frissítjük a kliens oldali store-t
				await i18nService.setLocale(locale, false);

				// Értesítjük a pluginokat a locale váltásról
				window.dispatchEvent(new CustomEvent('elyos:locale-change', { detail: { locale } }));

				// Töröljük az app registry cache-t, hogy a start menü az új nyelven töltse be az appokat
				appRegistry.clearCache();

				// Frissítjük a nyitott ablakok fejléc neveit az új locale alapján
				const openWindows = windowManager.windows;
				if (openWindows.length > 0) {
					const updatedApps = await appRegistry.getApps();
					for (const win of openWindows) {
						const app = updatedApps.find((a) => a.appName === win.appName);
						if (app && app.title !== win.title) {
							windowManager.updateWindowTitle(win.id, app.title);
						}
					}
				}

				// Frissítjük az oldalt, hogy a settings újratöltődjön
				await invalidate('app:settings');

				toast.success(t('settings.language.saved'));
				open = false;
			} else {
				toast.error(t('settings.language.error'));
			}
		} catch (error) {
			console.error('Locale change error:', error);
			toast.error(t('settings.language.error'));
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Get display text for the current locale
	 */
	function getDisplayText(): string {
		if (showFullName && currentLocaleConfig) {
			return currentLocaleConfig.nativeName;
		}
		return currentLocale.toUpperCase();
	}

	/**
	 * Get flag emoji for a locale
	 * Maps locale codes to country flag emojis
	 */
	function getFlag(localeCode: string): string {
		const flagMap: Record<string, string> = {
			hu: '🇭🇺',
			en: '🇬🇧',
			de: '🇩🇪',
			fr: '🇫🇷',
			es: '🇪🇸',
			it: '🇮🇹',
			pl: '🇵🇱',
			cs: '🇨🇿',
			sk: '🇸🇰',
			ro: '🇷🇴',
			uk: '🇺🇦',
			ru: '🇷🇺',
			ja: '🇯🇵',
			zh: '🇨🇳',
			ko: '🇰🇷'
		};
		return flagMap[localeCode] || '🌐';
	}
</script>

{#if showSwitcher}
	{#if variant === 'dropdown'}
		<!-- Dropdown variant -->
		<Popover.Root bind:open>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant={buttonVariant}
						{size}
						class="gap-2 {className}"
						disabled={isLoading}
					>
						<Globe class="h-4 w-4" />
						<span class="hidden sm:inline">{getDisplayText()}</span>
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-48 p-1" align="end">
				<div class="flex flex-col gap-0.5">
					{#each supportedLocales as locale (locale.code)}
						<button
							type="button"
							class="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors outline-none {locale.code ===
							currentLocale
								? 'bg-accent/50'
								: ''}"
							onclick={() => handleLocaleChange(locale.code)}
							disabled={isLoading}
						>
							<span class="flex items-center gap-2">
								<span>{locale.nativeName}</span>
								<span class="text-muted-foreground text-xs">({locale.name})</span>
							</span>
							{#if locale.code === currentLocale}
								<Check class="h-4 w-4" />
							{/if}
						</button>
					{/each}
				</div>
			</Popover.Content>
		</Popover.Root>
	{:else if variant === 'buttons'}
		<!-- Buttons variant -->
		<div class="flex gap-1 {className}">
			{#each supportedLocales as locale (locale.code)}
				<Button
					variant={locale.code === currentLocale ? 'default' : 'outline'}
					{size}
					onclick={() => handleLocaleChange(locale.code)}
					disabled={isLoading}
				>
					{showFullName ? locale.nativeName : locale.code.toUpperCase()}
				</Button>
			{/each}
		</div>
	{:else if variant === 'flags'}
		<!-- Flags variant -->
		<div class="flex gap-1 {className}">
			{#each supportedLocales as locale (locale.code)}
				<button
					type="button"
					class="hover:bg-accent focus:bg-accent rounded-md p-1.5 text-xl transition-all focus:outline-none {locale.code ===
					currentLocale
						? 'bg-accent ring-primary ring-2'
						: ''}"
					onclick={() => handleLocaleChange(locale.code)}
					disabled={isLoading}
					title={locale.nativeName}
				>
					{getFlag(locale.code)}
				</button>
			{/each}
		</div>
	{/if}
{/if}
