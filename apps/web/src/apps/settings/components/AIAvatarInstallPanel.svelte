<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { isAIAgentEnabled, listAvatarsForSettings } from '../admin-config.remote';
	import { installAvatar } from '$apps/ai-assistant/avatar.remote';
	import { ArrowLeft, Trash2 } from 'lucide-svelte/icons';

	const { t } = useI18n();
	const actionBar = getActionBar();

	// State
	let aiAgentEnabled = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let selectedFile = $state<File | null>(null);
	let installing = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let avatars = $state<
		Array<{
			idname: string;
			displayName: string;
			availableQualities: Array<'sd' | 'hd'>;
			manifest?: any;
			installedAt?: string;
		}>
	>([]);
	let loadingAvatars = $state(false);
	let flippedCards = $state<Set<string>>(new Set());

	onMount(async () => {
		// Ellenőrizzük, hogy az AI Agent engedélyezve van-e
		const status = await isAIAgentEnabled({});
		aiAgentEnabled = status.enabled;

		// Betöltjük a telepített avatarokat
		if (aiAgentEnabled) {
			await loadAvatars();
		}

		// Set initial action bar
		actionBar.clear();
	});

	async function loadAvatars() {
		loadingAvatars = true;
		try {
			const result = await listAvatarsForSettings({});

			if (result.success) {
				avatars = result.avatars;
			}
		} catch (err) {
			console.error('[AIAvatarInstallPanel] Hiba az avatarok betöltésekor:', err);
		} finally {
			loadingAvatars = false;
		}
	}

	function toggleCardFlip(idname: string) {
		if (flippedCards.has(idname)) {
			flippedCards.delete(idname);
		} else {
			flippedCards.add(idname);
		}
		flippedCards = new Set(flippedCards);
	}

	function handleDeleteAvatar(idname: string) {
		// TODO: Implement delete functionality
		console.log('Delete avatar:', idname);
		toast.info('Törlés funkció hamarosan elérhető');
	}

	// Fájl kiválasztás
	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		errorMessage = null;
		successMessage = null;

		if (file && !file.name.endsWith('.raconapkg')) {
			errorMessage = t('settings.admin.aiAvatar.validation.invalidFileType');
			selectedFile = null;
			input.value = '';
			return;
		}

		selectedFile = file;
	}

	// Telepítés
	async function handleInstall() {
		if (!selectedFile) return;

		installing = true;
		errorMessage = null;
		successMessage = null;

		try {
			// Fájl beolvasása base64-be
			const fileData = await readFileAsBase64(selectedFile);

			const result = await installAvatar({
				fileName: selectedFile.name,
				fileData
			});

			if (result.success) {
				successMessage = t('settings.admin.aiAvatar.installSuccess', {
					name: result.avatar?.displayName ?? selectedFile.name
				});
				toast.success(successMessage);
				// Visszaállítás
				selectedFile = null;
				if (fileInput) fileInput.value = '';
				// Frissítjük a telepített avatarok listáját
				await loadAvatars();
			} else {
				errorMessage = result.error ?? t('settings.admin.aiAvatar.installError');
				toast.error(errorMessage);
			}
		} catch (err) {
			console.error('[AIAvatarInstallPanel] Hiba:', err);
			errorMessage = t('settings.admin.aiAvatar.installError');
			toast.error(errorMessage);
		} finally {
			installing = false;
		}
	}

	// Segédfüggvény: File → base64
	function readFileAsBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}
</script>

{#if !aiAgentEnabled}
	<ContentSection
		title={t('settings.admin.aiAvatar.title')}
		description={t('settings.admin.aiAvatar.description')}
		contentPosition="bottom"
	>
		<div
			class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950"
		>
			<p class="text-sm font-medium text-yellow-900 dark:text-yellow-100">
				{t('settings.admin.aiAvatar.enableAIAgentFirst')}
			</p>
		</div>
	</ContentSection>
{:else}
	<ContentSection
		title={t('settings.admin.aiAvatar.uploadTitle')}
		description={t('settings.admin.aiAvatar.uploadDescription')}
		contentPosition="bottom"
	>
		{#snippet info()}
			{t('settings.admin.aiAvatar.uploadInfo')}
		{/snippet}

		<div class="mt-4 space-y-4">
			<!-- Fájl feltöltő és gomb -->
			<div class="flex items-start gap-3">
				<div class="flex-1 space-y-2">
					<label
						for="avatar-pkg-input"
						class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{t('settings.admin.aiAvatar.fileLabel')}
					</label>
					<input
						id="avatar-pkg-input"
						bind:this={fileInput}
						type="file"
						accept=".raconapkg"
						onchange={handleFileChange}
						disabled={installing}
						class="border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					/>
					{#if selectedFile}
						<p class="text-muted-foreground text-sm">
							📦 {selectedFile.name}
						</p>
					{/if}
				</div>
				<Button onclick={handleInstall} disabled={!selectedFile || installing} class="mt-6">
					{installing
						? t('settings.admin.aiAvatar.installing')
						: t('settings.admin.aiAvatar.install')}
				</Button>
			</div>

			<!-- Hibaüzenet -->
			{#if errorMessage}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
				>
					<p class="text-sm font-medium text-red-900 dark:text-red-100">{errorMessage}</p>
				</div>
			{/if}

			<!-- Sikeres telepítés -->
			{#if successMessage}
				<div
					class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
				>
					<p class="text-sm font-medium text-green-900 dark:text-green-100">{successMessage}</p>
				</div>
			{/if}
		</div>
	</ContentSection>

	<!-- Telepített avatarok -->
	<ContentSection
		title={t('settings.admin.aiAvatar.installedAvatars')}
		description={t('settings.admin.aiAvatar.installedAvatarsDescription')}
		contentPosition="bottom"
	>
		{#if loadingAvatars}
			<div class="flex items-center justify-center py-8">
				<div class="spinner"></div>
				<span class="text-muted-foreground ml-2 text-sm">{t('common.loading')}</span>
			</div>
		{:else if avatars.length === 0}
			<div
				class="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-900"
			>
				<p class="text-muted-foreground text-center text-sm">
					{t('settings.admin.aiAvatar.noAvatarsInstalled')}
				</p>
			</div>
		{:else}
			<div class="avatar-grid w-full">
				{#each avatars as avatar (avatar.idname)}
					{@const isFlipped = flippedCards.has(avatar.idname)}
					<div class="avatar-card-container">
						<div class="avatar-card-flipper" class:flipped={isFlipped}>
							<!-- Előlap -->
							<button
								type="button"
								class="avatar-card avatar-card-front"
								onclick={() => toggleCardFlip(avatar.idname)}
							>
								<div class="avatar-cover-wrapper">
									<img
										src="/api/ai-avatar/{avatar.idname}/{avatar.idname}_cover.jpg"
										alt={avatar.displayName}
										class="avatar-cover"
										loading="lazy"
									/>
									<div class="avatar-qualities-overlay">
										{#each avatar.availableQualities as quality}
											<span class="quality-badge quality-badge-front">{quality.toUpperCase()}</span>
										{/each}
									</div>
								</div>
							</button>

							<!-- Hátlap -->
							<div class="avatar-card avatar-card-back">
								<div class="card-back-header">
									<button
										type="button"
										class="flip-back-button"
										onclick={() => toggleCardFlip(avatar.idname)}
										aria-label={t('common.back')}
									>
										<ArrowLeft class="h-4 w-4" />
									</button>
								</div>

								<div class="card-back-content">
									<h4 class="card-back-name">{avatar.displayName}</h4>

									{#if avatar.manifest?.descriptions}
										<p class="card-back-description">
											{avatar.manifest.descriptions.hu || avatar.manifest.descriptions.en || '-'}
										</p>
									{/if}

									{#if avatar.installedAt}
										<div class="card-back-date">
											<span class="date-label">{t('common.installedAt')}</span>
											<span class="date-value"
												>{new Date(avatar.installedAt).toLocaleDateString('hu-HU', {
													year: 'numeric',
													month: 'long',
													day: 'numeric'
												})}</span
											>
										</div>
									{/if}
								</div>

								<div class="card-back-actions">
									<button
										type="button"
										class="delete-button"
										onclick={() => handleDeleteAvatar(avatar.idname)}
									>
										<Trash2 class="h-4 w-4" />
										{t('settings.admin.aiAvatar.delete')}
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</ContentSection>
{/if}

<style>
	.spinner {
		animation: spin 0.8s linear infinite;
		border: 3px solid var(--color-neutral-200);
		border-top-color: var(--color-primary-500);
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
	}

	:global(.dark) .spinner {
		border-color: var(--color-neutral-700);
		border-top-color: var(--color-primary-400);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 1.5rem;
	}

	.avatar-card-container {
		perspective: 1000px;
		aspect-ratio: 1;
		height: auto;
	}

	.avatar-card-flipper {
		position: relative;
		transform-style: preserve-3d;
		transition: transform 0.6s;
		width: 100%;
		height: 100%;
	}

	.avatar-card-flipper.flipped {
		transform: rotateY(180deg);
	}

	.avatar-card {
		display: flex;
		position: absolute;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		backface-visibility: hidden;
		transition:
			border-color 0.15s,
			background 0.15s,
			transform 0.15s;
		border: none;
		border-radius: var(--radius-md, 0.5rem);
		background: transparent;
		padding: 0;
		width: 100%;
		height: 100%;
		text-align: center;
	}

	.avatar-card-front {
		cursor: pointer;
	}

	.avatar-card-front:hover .avatar-cover {
		transform: scale(1.05);
	}

	.avatar-cover-wrapper {
		position: relative;
		width: 100%;
	}

	.avatar-cover {
		transition: transform 0.2s;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border-radius: var(--radius-md, 0.5rem);
		aspect-ratio: 1;
		width: 100%;
		object-fit: cover;
	}

	:global(.dark) .avatar-cover {
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.3),
			0 2px 4px -1px rgba(0, 0, 0, 0.2);
	}

	.avatar-qualities-overlay {
		display: flex;
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		flex-direction: column;
		gap: 0.25rem;
	}

	.avatar-card-back {
		justify-content: space-between;
		transform: rotateY(180deg);
		border: 2px solid var(--color-neutral-200);
		background: var(--color-neutral-50);
		padding: 1rem;
	}

	:global(.dark) .avatar-card-back {
		border-color: var(--color-neutral-700);
		background: var(--color-neutral-800);
	}

	.card-back-header {
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		margin-bottom: 0;
		width: 100%;
	}

	.flip-back-button {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		transition: color 0.15s;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0.25rem;
		color: var(--color-neutral-600);
	}

	.flip-back-button:hover {
		color: var(--color-primary-500);
	}

	:global(.dark) .flip-back-button {
		color: var(--color-neutral-400);
	}

	:global(.dark) .flip-back-button:hover {
		color: var(--color-primary-400);
	}

	.card-back-title {
		margin: 0;
		overflow: hidden;
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .card-back-title {
		color: var(--color-neutral-100);
	}

	.card-back-name {
		margin: 0 0 0.5rem 0;
		color: var(--color-neutral-900);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.2;
		text-align: center;
	}

	:global(.dark) .card-back-name {
		color: var(--color-neutral-100);
	}

	.card-back-description {
		margin: 0 0 0.5rem 0;
		color: var(--color-neutral-700);
		font-size: 0.8125rem;
		line-height: 1.5;
		text-align: center;
	}

	:global(.dark) .card-back-description {
		color: var(--color-neutral-300);
	}

	.card-back-date {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		margin-top: auto;
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-neutral-100);
		padding: 0.5rem;
	}

	:global(.dark) .card-back-date {
		background: var(--color-neutral-900);
	}

	.date-label {
		color: var(--color-neutral-500);
		font-weight: 600;
		font-size: 0.625rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.date-value {
		color: var(--color-neutral-800);
		font-weight: 500;
		font-size: 0.75rem;
	}

	:global(.dark) .date-value {
		color: var(--color-neutral-200);
	}

	.card-back-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		width: 100%;
		overflow-y: auto;
	}

	.card-back-actions {
		display: flex;
		justify-content: center;
		padding-top: 0.25rem;
		width: 100%;
	}

	.delete-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition:
			background 0.15s,
			color 0.15s;
		cursor: pointer;
		border: 1px solid var(--color-red-300);
		border-radius: var(--radius-sm, 0.25rem);
		background: var(--color-red-50);
		padding: 0.375rem 0.625rem;
		color: var(--color-red-700);
		font-weight: 500;
		font-size: 0.6875rem;
	}

	.delete-button:hover {
		border-color: var(--color-red-400);
		background: var(--color-red-100);
		color: var(--color-red-800);
	}

	:global(.dark) .delete-button {
		border-color: var(--color-red-700);
		background: var(--color-red-950);
		color: var(--color-red-300);
	}

	:global(.dark) .delete-button:hover {
		border-color: var(--color-red-600);
		background: var(--color-red-900);
		color: var(--color-red-200);
	}

	.quality-badge {
		display: inline-block;
		border-radius: var(--radius-sm, 0.25rem);
		padding: 0.25rem 0.5rem;
		font-weight: 600;
		font-size: 0.6875rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.quality-badge-front {
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(0, 0, 0, 0.6);
		color: white;
	}
</style>
