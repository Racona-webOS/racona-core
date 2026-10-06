<script lang="ts">
	import ColorPicker from '$lib/components/ui/ColorPicker.svelte';
	import { ConfirmDialog } from '$lib/components/ui';
	import { toast } from 'svelte-sonner';
	import { updateSettings } from '../settings.remote';
	import { deleteBackground } from '$lib/storage/delete-background.remote';
	import { getContext } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { BackgroundType } from '$lib/constants';
	import { useI18n } from '$lib/i18n/hooks';
	import { FileUploader } from '$lib/components/file-uploader';
	import type { UploadResult } from '$lib/components/file-uploader/types';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';

	// Ikonok
	import Palette from 'lucide-svelte/icons/palette';
	import Image from 'lucide-svelte/icons/image';
	import Video from 'lucide-svelte/icons/video';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	// i18n
	const { t } = useI18n();

	// Settings objektum a kontextusból
	const settings = getContext<{
		background: {
			type: BackgroundType;
			value: string;
			scope?: 'shared' | 'user';
			blur?: number;
			grayscale?: boolean;
		};
		userId?: string;
	}>('settings');

	// Lokális állapot a színválasztóhoz
	let colorValue = $state(
		settings.background.type === 'color' ? settings.background.value : '#1e293b'
	);

	// Képek listái
	let sharedImages = $state<string[]>([]);
	let userImages = $state<string[]>([]);
	let sharedVideos = $state<string[]>([]);

	// Törlés megerősítő dialog állapota
	let deleteDialogOpen = $state(false);
	let imageToDelete = $state<string | null>(null);

	// Fájlok betöltése scope és típus alapján
	async function loadFiles(scope: 'shared' | 'user', type: 'image' | 'video'): Promise<string[]> {
		try {
			const typeParam = scope === 'shared' ? `&type=${type}` : '';
			const response = await fetch(
				`/api/files/list?category=backgrounds&scope=${scope}${typeParam}`
			);
			if (response.ok) {
				const data = await response.json();
				// Kiszűrjük a thumbnail fájlokat (thumb- prefixszel kezdődnek)
				// Videóknál a .jpg thumbnaileket is kiszűrjük
				return (
					data.files
						?.map((f: { filename: string }) => f.filename)
						.filter((filename: string) => {
							if (filename.startsWith('thumb-')) return false;
							// Videó típusnál csak a videó fájlokat tartjuk meg
							if (type === 'video') {
								const ext = filename.split('.').pop()?.toLowerCase();
								return ['mp4', 'webm', 'ogg'].includes(ext || '');
							}
							return true;
						}) || []
				);
			}
		} catch (error) {
			console.error(`Failed to load ${scope} ${type}s:`, error);
		}
		return [];
	}

	// Betöltjük a fájlokat komponens mountolásakor
	$effect(() => {
		if (settings.background.type === 'image') {
			loadFiles('shared', 'image').then((files) => (sharedImages = files));
			if (settings.userId) {
				loadFiles('user', 'image').then((files) => (userImages = files));
			}
		} else if (settings.background.type === 'video') {
			loadFiles('shared', 'video').then((files) => (sharedVideos = files));
		}
	});

	// Háttér típus változtatása
	async function handleBackgroundTypeChange(newType: BackgroundType) {
		try {
			let newValue = '';
			let newScope: 'shared' | 'user' = 'shared';

			// Alapértelmezett érték beállítása típus szerint
			if (newType === 'color') {
				newValue = colorValue;
			} else if (newType === 'image') {
				// Betöltjük a shared képeket és az elsőt választjuk
				const images = await loadFiles('shared', 'image');
				sharedImages = images;
				newValue = images[0] || '';
				newScope = 'shared';
			} else if (newType === 'video') {
				// Betöltjük a shared videókat és az elsőt választjuk
				const videos = await loadFiles('shared', 'video');
				sharedVideos = videos;
				newValue = videos[0] || '';
			}

			const result = await updateSettings({
				background: { type: newType, value: newValue, scope: newScope }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.type.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Background type update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Szín változtatása
	async function handleColorChange(newColor: string) {
		colorValue = newColor;

		try {
			const result = await updateSettings({
				background: { type: 'color', value: newColor }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.color.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Color update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Kép kiválasztása (közös függvény shared és user scope-hoz)
	async function handleImageSelect(filename: string, scope: 'shared' | 'user') {
		try {
			const result = await updateSettings({
				background: { type: 'image', value: filename, scope }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.image.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Image update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Feltöltés befejezése
	async function handleUploadComplete(result: UploadResult) {
		if (result.success && result.file) {
			// A tárolt fájlnév (szanálva, egyedivé téve) eltérhet az eredetitől
			const storedName = result.file.filename ?? result.file.originalName;

			// Frissítjük a felhasználói képek listáját
			userImages = [...userImages, storedName];

			// Beállítjuk az új képet háttérnek
			await handleImageSelect(storedName, 'user');
			toast.success(t('settings.background.upload.success'));
		}
	}

	// Feltöltési hiba
	function handleUploadError(error: { code: string; message: string }) {
		toast.error(error.message);
	}

	// Videó változtatása
	async function handleVideoChange(newVideo: string) {
		try {
			const result = await updateSettings({
				background: { type: 'video', value: newVideo }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.video.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Video update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Homályosítás mértékének változtatása
	let blurValue = $state(settings.background.blur ?? 0);
	let blurTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleBlurValueChange(value: number) {
		blurValue = value;

		// Debounce: csak a slider elengedése után mentünk
		if (blurTimeout) clearTimeout(blurTimeout);
		blurTimeout = setTimeout(() => saveBlur(blurValue), 400);
	}

	async function saveBlur(value: number) {
		try {
			const result = await updateSettings({
				background: { blur: value }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.blur.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Blur update error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Szürkeárnyalatos mód be/kikapcsolása
	async function handleGrayscaleChange() {
		const newValue = !settings.background.grayscale;
		try {
			const result = await updateSettings({
				background: { grayscale: newValue }
			});

			if (result && 'success' in result && result.success) {
				await invalidate('app:settings');
				toast.success(t('settings.background.grayscale.saved'));
			} else {
				toast.error(t('common.errors.saveFailed'));
			}
		} catch (error) {
			console.error('Grayscale toggle error:', error);
			toast.error(t('common.errors.saveFailed'));
		}
	}

	// Segédfüggvény a thumbnail URL-hez
	function getThumbnailUrl(filename: string, scope: 'shared' | 'user'): string {
		const thumbFilename = `thumb-${filename}`;
		if (scope === 'user' && settings.userId) {
			return `/api/files/backgrounds/user-${settings.userId}/${thumbFilename}`;
		}
		return `/api/files/backgrounds/shared/image/${thumbFilename}`;
	}

	// Segédfüggvény a videó thumbnail URL-hez (thumb-{videoname}.jpg formátum)
	function getVideoThumbnailUrl(filename: string): string {
		// A videó fájlnévből eltávolítjuk a kiterjesztést és .jpg-t adunk hozzá
		const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
		return `/api/files/backgrounds/shared/video/thumb-${nameWithoutExt}.jpg`;
	}

	// Ellenőrzi, hogy a kép aktív-e
	function isImageActive(filename: string, scope: 'shared' | 'user'): boolean {
		return settings.background.value === filename && settings.background.scope === scope;
	}

	// Törlés megerősítés kérése
	function confirmDeleteImage(filename: string) {
		imageToDelete = filename;
		deleteDialogOpen = true;
	}

	// Kép törlése
	async function handleDeleteImage() {
		if (!imageToDelete) return;

		try {
			const result = await deleteBackground({ filename: imageToDelete });

			if (result.success) {
				// Ha a törölt kép volt beállítva háttérnek, visszaállítjuk az alapértelmezettre
				if (settings.background.value === imageToDelete && settings.background.scope === 'user') {
					const firstShared = sharedImages[0];
					if (firstShared) {
						await updateSettings({
							background: { type: 'image', value: firstShared, scope: 'shared' }
						});
						await invalidate('app:settings');
					}
				}

				// Frissítjük a listát
				userImages = userImages.filter((img) => img !== imageToDelete);
				toast.success(t('settings.background.delete.success'));
			} else {
				toast.error(result.error || t('settings.background.delete.error'));
			}
		} catch (error) {
			console.error('Delete image error:', error);
			toast.error(t('settings.background.delete.error'));
		}

		imageToDelete = null;
	}

	// Törlés megszakítása
	function cancelDelete() {
		imageToDelete = null;
	}
</script>

<h2>{t('settings.background.title')}</h2>

<!-- Háttér Típus Szekció -->
<ContentSection
	title={t('settings.background.type.label')}
	description={t('settings.background.type.description')}
	contentPosition="bottom"
>
	{#snippet info()}
		{t('settings.background.type.info')}
	{/snippet}

	<div class="background-type-cards">
		<button
			class="background-card"
			class:active={settings.background.type === 'color'}
			onclick={() => handleBackgroundTypeChange('color')}
		>
			<div class="background-card-icon">
				<Palette size={28} />
			</div>
			<span class="background-card-label">{t('settings.background.type.color')}</span>
		</button>

		<button
			class="background-card"
			class:active={settings.background.type === 'image'}
			onclick={() => handleBackgroundTypeChange('image')}
		>
			<div class="background-card-icon">
				<Image size={28} />
			</div>
			<span class="background-card-label">{t('settings.background.type.image')}</span>
		</button>

		<button
			class="background-card"
			class:active={settings.background.type === 'video'}
			onclick={() => handleBackgroundTypeChange('video')}
		>
			<div class="background-card-icon">
				<Video size={28} />
			</div>
			<span class="background-card-label">{t('settings.background.type.video')}</span>
		</button>
	</div>
</ContentSection>

<!-- Szín Beállítás Szekció -->
{#if settings.background.type === 'color'}
	<ContentSection
		title={t('settings.background.color.label')}
		description={t('settings.background.color.description')}
		contentPosition="bottom"
	>
		{#snippet info()}
			{t('settings.background.color.info')}
		{/snippet}

		<ColorPicker currentColor={colorValue} onColorChange={handleColorChange} />
	</ContentSection>
{/if}

<!-- Kép Beállítás Szekció -->
{#if settings.background.type === 'image'}
	<!-- Rendszer képek -->
	{#if sharedImages.length > 0}
		<ContentSection
			title={t('settings.background.image.label')}
			description={t('settings.background.image.description')}
			contentPosition="bottom"
		>
			{#snippet info()}
				{t('settings.background.image.info')}
			{/snippet}

			<div class="image-selection">
				{#each sharedImages as image}
					<button
						class="image-option"
						class:active={isImageActive(image, 'shared')}
						onclick={() => handleImageSelect(image, 'shared')}
						aria-label="{t('settings.background.image.label')} {image}"
					>
						<div
							class="image-preview"
							style="background-image: url('{getThumbnailUrl(image, 'shared')}')"
						></div>
					</button>
				{/each}
			</div>
		</ContentSection>
	{/if}

	<!-- Saját kép feltöltése -->
	<ContentSection
		title={t('settings.background.upload.label')}
		description={t('settings.background.upload.description')}
		contentPosition="bottom"
	>
		<FileUploader
			category="backgrounds"
			scope="user"
			mode="instant"
			fileType="image"
			allowedExtensions={['jpg', 'jpeg', 'png', 'webp']}
			onUploadComplete={handleUploadComplete}
			onError={handleUploadError}
			generateThumbnail={true}
		/>
	</ContentSection>

	<!-- Felhasználói képek -->
	{#if userImages.length > 0}
		<ContentSection
			title={t('settings.background.userImages.label')}
			description={t('settings.background.userImages.description')}
			contentPosition="bottom"
		>
			<div class="image-selection">
				{#each userImages as image}
					<div class="user-image-wrapper">
						<button
							class="image-option"
							class:active={isImageActive(image, 'user')}
							onclick={() => handleImageSelect(image, 'user')}
							aria-label="{t('settings.background.image.label')} {image}"
						>
							<div
								class="image-preview"
								style="background-image: url('{getThumbnailUrl(image, 'user')}')"
							></div>
						</button>
						<button
							class="delete-button"
							onclick={() => confirmDeleteImage(image)}
							aria-label={t('settings.background.delete.button')}
							title={t('settings.background.delete.button')}
						>
							<Trash2 size={16} />
						</button>
					</div>
				{/each}
			</div>
		</ContentSection>
	{/if}

	<!-- Homályosítás opció -->
	<ContentSection
		title={t('settings.background.blur.label')}
		description={t('settings.background.blur.description')}
		contentPosition="bottom"
	>
		{#snippet info()}
			{t('settings.background.blur.info')}
		{/snippet}

		<div class="blur-slider-container">
			<Slider
				type="single"
				value={blurValue}
				min={0}
				max={30}
				step={2}
				onValueChange={handleBlurValueChange}
			/>
			<span class="blur-value">{blurValue}px</span>
		</div>
	</ContentSection>

	<!-- Szürkeárnyalatos opció -->
	<ContentSection
		title={t('settings.background.grayscale.label')}
		description={t('settings.background.grayscale.description')}
	>
		{#snippet info()}
			{t('settings.background.grayscale.info')}
		{/snippet}

		<Switch
			id="background-grayscale"
			checked={settings.background.grayscale ?? false}
			onclick={handleGrayscaleChange}
		/>
	</ContentSection>
{/if}

<!-- Törlés megerősítő dialog -->
<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={t('settings.background.delete.title')}
	description={t('settings.background.delete.description')}
	confirmText={t('settings.background.delete.confirm')}
	cancelText={t('settings.background.delete.cancel')}
	confirmVariant="destructive"
	onConfirm={handleDeleteImage}
	onCancel={cancelDelete}
/>

<!-- Videó Beállítás Szekció -->
{#if settings.background.type === 'video'}
	{#if sharedVideos.length > 0}
		<ContentSection
			title={t('settings.background.video.label')}
			description={t('settings.background.video.description')}
			contentPosition="bottom"
		>
			{#snippet info()}
				{t('settings.background.video.info')}
			{/snippet}

			<div class="image-selection">
				{#each sharedVideos as video}
					<button
						class="image-option"
						class:active={settings.background.value === video}
						onclick={() => handleVideoChange(video)}
						aria-label="{t('settings.background.video.label')} {video}"
					>
						<div
							class="image-preview"
							style="background-image: url('{getVideoThumbnailUrl(video)}')"
						></div>
					</button>
				{/each}
			</div>
		</ContentSection>
	{/if}
{/if}

<style>
	/* Háttér típus kártyák */
	.background-type-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
		width: 100%;
	}

	.background-card {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.625rem;
		transition: all 0.2s ease;
		cursor: pointer;
		border: 2px solid var(--color-neutral-200);
		border-radius: var(--radius-lg, 0.5rem);
		background-color: transparent;
		padding: 1.25rem 0.75rem;
		min-height: 100px;
	}

	:global(.dark) .background-card {
		border-color: var(--color-neutral-700);
	}

	.background-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: var(--color-primary-400);
		background-color: var(--color-primary-50);
	}

	:global(.dark) .background-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		border-color: var(--color-primary-500);
		background-color: var(--color-primary-950);
	}

	.background-card.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: var(--color-primary-500);
		background-color: var(--color-primary-50);
	}

	:global(.dark) .background-card.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		border-color: var(--color-primary-400);
		background-color: var(--color-primary-900);
	}

	.background-card-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--color-neutral-600);
	}

	:global(.dark) .background-card-icon {
		color: var(--color-neutral-400);
	}

	.background-card.active .background-card-icon {
		color: var(--color-primary-600);
	}

	:global(.dark) .background-card.active .background-card-icon {
		color: var(--color-primary-400);
	}

	.background-card-label {
		color: var(--color-neutral-700);
		font-weight: 500;
		font-size: 0.8125rem;
	}

	:global(.dark) .background-card-label {
		color: var(--color-neutral-300);
	}

	.background-card.active .background-card-label {
		color: var(--color-primary-700);
		font-weight: 600;
	}

	:global(.dark) .background-card.active .background-card-label {
		color: var(--color-primary-300);
	}

	/* Kép választó */
	.image-selection {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 0.5rem;
		width: 100%;
	}

	.image-option {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.2s ease;
		cursor: pointer;
		border: 2px solid var(--color-neutral-200);
		border-radius: var(--radius-lg, 0.5rem);
		background-color: transparent;
		padding: 0.5rem;
		width: 100%;
	}

	:global(.dark) .image-option {
		border-color: var(--color-neutral-700);
	}

	.image-option:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: var(--color-primary-400);
	}

	:global(.dark) .image-option:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		border-color: var(--color-primary-500);
	}

	.image-option.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: var(--color-primary-500);
		background-color: var(--color-primary-50);
	}

	:global(.dark) .image-option.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		border-color: var(--color-primary-400);
		background-color: var(--color-primary-900);
	}

	.image-preview {
		border-radius: var(--radius-md, 0.375rem);
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 120px;
	}

	/* Felhasználói kép wrapper törlés gombbal */
	.user-image-wrapper {
		position: relative;
	}

	.delete-button {
		display: flex;
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		justify-content: center;
		align-items: center;
		opacity: 0;
		transition: all 0.2s ease;
		cursor: pointer;
		border: none;
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-red-500);
		padding: 0.375rem;
		color: white;
	}

	.user-image-wrapper:hover .delete-button {
		opacity: 1;
	}

	.delete-button:hover {
		transform: scale(1.1);
		background-color: var(--color-red-600);
	}

	.delete-button:focus-visible {
		opacity: 1;
		outline: 2px solid var(--color-red-400);
		outline-offset: 2px;
	}

	/* Blur slider */
	.blur-slider-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
		width: 100%;
	}

	.blur-value {
		min-width: 3rem;
		color: var(--color-neutral-700);
		font-weight: 600;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	:global(.dark) .blur-value {
		color: var(--color-neutral-300);
	}
</style>
