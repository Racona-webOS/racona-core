<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../appAdmin.css';
	import Decor from '$lib/components/auth/Decor.svelte';
	//import LogoVideo from '$lib/components/shared/LogoVideo.svelte';
	import LogoImage from '$lib/components/shared/LogoImage.svelte';
	// @ts-expect-error - no type declarations available
	import '@fontsource-variable/quicksand';
	import { setContext } from 'svelte';
	import { I18nProvider, AuthLocaleSwitcher } from '$lib/i18n/components';
	import { getSupportedLocales } from '$lib/i18n/config';
	import { getTranslationStore } from '$lib/i18n/store.svelte';
	import { browser } from '$app/environment';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { TriangleAlert } from 'lucide-svelte';

	let { children, data }: LayoutProps = $props();

	const store = getTranslationStore();

	// Támogatott nyelvek beállítása a szerverről jövő konfigurációval
	// és locale szinkronizálása a szerverről jövő értékkel
	if (browser) {
		// eslint-disable-next-line svelte/valid-compile -- initial setup, not reactive
		const rawLocales = data.supportedLocales;
		const localeArray = Array.isArray(rawLocales)
			? rawLocales
			: rawLocales
				? [rawLocales]
				: undefined;
		const supportedLocales = getSupportedLocales(localeArray);
		store.setSupportedLocales(supportedLocales);

		// Ha a szerverről jövő locale eltér a jelenlegi locale-tól, szinkronizáljuk
		// Ez biztosítja, hogy a cookie-ban tárolt nyelv érvényesüljön oldal újratöltéskor
		if (data.locale && data.locale !== store.currentLocale) {
			store.setLocale(data.locale);
		}
	}

	let decorTitle = $state('');
	let decorDescription = $state('');
	let isAnimating = $state(false);

	setContext('authDecor', {
		setDecorText: (title: string, description: string) => {
			decorTitle = title;
			decorDescription = description;
		},
		setAnimating: (value: boolean) => {
			isAnimating = value;
		}
	});
</script>

<svelte:head>
	<title>{data.appName} - {page.data.title}</title>
</svelte:head>

<I18nProvider namespaces={['common', 'auth']}>
	{#if store.loadedNamespaces.has('auth') && store.loadedNamespaces.has('common')}
		<div class="auth auth-fade-in">
			{#if data.demoMode}
				<div class="demo-banner flex w-[70%] max-w-[1000px] rounded-2xl shadow-2xl">
					<TriangleAlert class="w-24" />
					{data.demoNotice}
					<TriangleAlert class="w-24" />
				</div>
			{/if}
			<div
				class="auth-container flex w-[70%] max-w-[1000px] overflow-hidden rounded-2xl shadow-2xl"
				class:animating={isAnimating}
			>
				<!-- Bal oldal - Form -->
				<div class="left-side flex w-full flex-col justify-between bg-white p-8 lg:w-2/5 lg:p-10">
					<AuthLocaleSwitcher />
					<div class="mt-8 grid gap-6">
						<LogoImage width={240} />
						{@render children()}
					</div>
				</div>

				<!-- Jobb oldal - Dekoratív háttér -->
				<div class="right-side relative hidden overflow-hidden lg:block lg:w-3/5">
					<Decor />

					<!-- Szöveg tartalom - csak akkor jelenítjük meg, ha van szöveg -->
					{#if decorTitle}
						<div
							class="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center"
						>
							<h1 class="mb-4 text-3xl font-light tracking-wide text-white">{decorTitle}</h1>
							<p class="text-base text-gray-300">{decorDescription}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</I18nProvider>

<style>
	.auth {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		height: 100vh;
	}

	.demo-banner {
		display: flex;
		justify-content: center;
		align-items: center;
		animation: shimmer 10s ease infinite;

		background: linear-gradient(
			135deg,
			#fffbeb 0%,
			#fef3c7 25%,
			#fde68a 50%,
			#fef3c7 75%,
			#fffbeb 100%
		);
		background-size: 300% 300%;
		padding: 0.75rem 1.125rem;
		color: #78350f;
		font-size: 90%;
		text-align: center;
	}

	@keyframes shimmer {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.demo-banner .icon {
		flex-shrink: 0;
		filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
		margin-top: 0.175rem;
		width: 1rem;
		height: 1rem;
		color: #f59e0b;
	}

	.right-side {
		font-family: 'Quicksand Variable', serif;
	}

	.auth-fade-in {
		animation: fadeIn 0.2s ease-in forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.auth-container.animating {
		animation:
			collapseVertical 0.3s ease-in forwards,
			collapseHorizontal 0.3s ease-out 0.3s forwards;
	}

	@keyframes collapseVertical {
		0% {
			transform: scaleY(1);
			opacity: 1;
		}
		100% {
			transform: scaleY(0.01);
			opacity: 0.8;
		}
	}

	@keyframes collapseHorizontal {
		0% {
			transform: scaleY(0.01) scaleX(1);
			opacity: 0.8;
		}
		100% {
			transform: scaleY(0.01) scaleX(0);
			opacity: 0;
		}
	}
</style>
