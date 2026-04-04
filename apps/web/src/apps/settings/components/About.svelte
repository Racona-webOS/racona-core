<script lang="ts">
	import Logo from '$lib/assets/logo.png?enhanced';
	import { Mail, Globe, Package, ChevronRight } from 'lucide-svelte';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	const version = '0.1.1';
	const contactEmail = 'hello@elyos.hu';
	const website = 'https://elyos.hu';
	const year = new Date().getFullYear();

	const changelog = [
		{
			version: '0.0.2',
			date: '2025-01-25',
			title: 'About oldal fejlesztések'
		},
		{
			version: '0.0.1',
			date: '2025-01-25',
			title: 'Kezdeti verzió'
		}
	];
</script>

<div class="flex h-full flex-col justify-between">
	<div class="flex flex-1 flex-col items-center justify-center space-y-8 text-center">
		<!-- Logo -->
		<div class="flex justify-center">
			<enhanced:img src={Logo} alt="ElyOS Logo" width="220" />
		</div>

		<!-- Verzió -->
		<div class="text-muted-foreground flex items-center justify-center gap-2">
			<Package class="h-4 w-4" />
			<span class="text-sm">{t('settings.about.version')} {version}</span>
		</div>

		<!-- Leírás -->
		<p class="text-muted-foreground mx-auto max-w-md">
			{t('settings.about.description')}
		</p>

		<!-- Kapcsolat és linkek -->
		<div class="flex flex-wrap items-center justify-center gap-4">
			<!-- Email -->
			<a
				href="mailto:{contactEmail}"
				class="flex items-center gap-2 rounded-lg bg-black/5 px-4 py-2 text-sm transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
			>
				<Mail class="h-4 w-4" />
				<span>{contactEmail}</span>
			</a>

			<!-- Weboldal -->
			<a
				href={website}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-2 rounded-lg bg-black/5 px-4 py-2 text-sm transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
			>
				<Globe class="h-4 w-4" />
				<span>elyos.hu</span>
			</a>
		</div>

		<!-- Changelog Section -->
		<div class="mt-8 hidden w-full max-w-md">
			<ContentSection title="" description={t('settings.about.changelog')}>
				{#snippet info()}
					<div class="space-y-2">
						{#each changelog as entry (entry.version)}
							<button
								class="flex w-full items-center justify-between rounded-lg bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
							>
								<div class="flex items-center gap-3">
									<span class="text-sm font-medium">v{entry.version}</span>
									<span class="text-muted-foreground text-xs">{entry.title}</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground text-xs">{entry.date}</span>
									<ChevronRight class="text-muted-foreground h-4 w-4" />
								</div>
							</button>
						{/each}
					</div>
				{/snippet}
			</ContentSection>
		</div>
	</div>

	<!-- Footer -->
	<div class="text-muted-foreground my-4 text-center text-xs">
		<p>{t('settings.about.copyright', { year })}</p>
	</div>
</div>
