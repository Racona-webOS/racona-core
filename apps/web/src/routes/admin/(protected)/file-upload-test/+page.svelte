<script lang="ts">
	import { onMount } from 'svelte';
	import FileUploader from '$lib/components/file-uploader/FileUploader.svelte';
	import type {
		UploadResult,
		UploadError,
		FileScope
	} from '$lib/components/file-uploader/types.js';
	import { listFiles } from '$lib/storage/list-files.remote.js';
	import { deleteFile } from '$lib/storage/delete-file.remote.js';
	import AiAvatarCanvas from '$apps/ai-assistant/components/AiAvatarCanvas.svelte';
	import type { EmotionState } from '$apps/ai-assistant/types/index.js';

	// State
	let uploadedFiles = $state<
		Array<{ id: string; filename: string; url: string; size: number; mimeType: string }>
	>([]);
	let selectedCategory = $state('test-uploads');
	let selectedScope = $state<FileScope>('user');
	let lastError = $state<string | null>(null);
	let isLoadingFiles = $state(false);
	let isInstantUploading = $state(false);
	let instantUploadedFile = $state<{
		id: string;
		filename: string;
		url: string;
		thumbnailUrl?: string;
	} | null>(null);

	// Avatar teszt állapotok
	let emotionState = $state<EmotionState>('neutral');
	let theme = $state<'light' | 'dark'>('light');

	// Modell fájlnevek tömbje
	let modelFilenames = $state<string[]>(['h1.glb', 'h3_2k.glb', 'h4_2k.glb', 'h5.glb']);

	// Feltöltött fájlok listájának frissítése
	async function refreshFileList() {
		isLoadingFiles = true;
		try {
			const result = await listFiles({
				category: selectedCategory,
				scope: selectedScope
			});
			if (result.success) {
				uploadedFiles = result.files.map((f) => ({
					id: f.id,
					filename: f.filename,
					url: f.url,
					size: f.size,
					mimeType: f.mimeType
				}));
			}
		} catch (e) {
			console.error('Failed to load files:', e);
		} finally {
			isLoadingFiles = false;
		}
	}

	// Fájl törlése
	async function handleDelete(fileId: string) {
		try {
			const result = await deleteFile({ fileId });
			if (result.success) {
				uploadedFiles = uploadedFiles.filter((f) => f.id !== fileId);
			} else {
				lastError = result.error || 'Törlés sikertelen';
			}
		} catch (e) {
			lastError = 'Törlés sikertelen';
		}
	}

	function handleUploadComplete(result: UploadResult) {
		console.log('Upload complete:', result);
		lastError = null;
		if (result.success && result.file) {
			uploadedFiles = [
				...uploadedFiles,
				{
					id: result.file.id,
					filename: result.file.originalName,
					url: result.file.url,
					size: result.file.size,
					mimeType: result.file.mimeType
				}
			];
		}
	}

	function handleInstantUploadStart() {
		isInstantUploading = true;
		lastError = null;
	}

	function handleInstantUploadComplete(result: UploadResult) {
		console.log('Instant upload complete:', result);
		isInstantUploading = false;
		lastError = null;
		if (result.success && result.file) {
			instantUploadedFile = {
				id: result.file.id,
				filename: result.file.originalName,
				url: result.file.url,
				thumbnailUrl: result.file.thumbnailUrl
			};
			// Hozzáadjuk a fájlok listájához is
			uploadedFiles = [
				...uploadedFiles,
				{
					id: result.file.id,
					filename: result.file.originalName,
					url: result.file.url,
					size: result.file.size,
					mimeType: result.file.mimeType
				}
			];
		}
	}

	function handleInstantUploadError(error: UploadError) {
		console.error('Instant upload error:', error);
		isInstantUploading = false;
		lastError = error.message;
	}

	function clearInstantUpload() {
		instantUploadedFile = null;
	}

	function handleError(error: UploadError) {
		console.error('Upload error:', error);
		lastError = error.message;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}

	// Kezdeti betöltés
	onMount(() => {
		refreshFileList();
	});
</script>

<div class="h-screen overflow-auto">
	<div class="container mx-auto max-w-4xl space-y-6 p-6">
		<div>
			<h1 class="text-2xl font-bold">File Uploader Teszt</h1>
			<p class="text-muted-foreground">
				Teszteld a fájlfeltöltő komponenst instant és standard módban különböző beállításokkal.
			</p>
		</div>

		<!-- Avatar Összehasonlítás -->
		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-semibold">🦝 Avatar Összehasonlítás</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Két különböző 3D modell összehasonlítása egymás mellett
			</p>

			<!-- Vezérlők -->
			<div class="mb-4 flex flex-wrap gap-4">
				<div>
					<label for="emotion-select" class="mb-1 block text-sm font-medium">Érzelem</label>
					<select
						id="emotion-select"
						bind:value={emotionState}
						class="border-input bg-background rounded-md border px-3 py-2"
					>
						<option value="neutral">Neutral</option>
						<option value="happy">Happy</option>
						<option value="sad">Sad</option>
						<option value="thinking">Thinking</option>
						<option value="excited">Excited</option>
					</select>
				</div>
				<div>
					<label for="theme-select" class="mb-1 block text-sm font-medium">Téma</label>
					<select
						id="theme-select"
						bind:value={theme}
						class="border-input bg-background rounded-md border px-3 py-2"
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
				</div>
			</div>

			<!-- Avatar párok -->
			<div class="grid gap-6 md:grid-cols-2">
				{#each modelFilenames as filename}
					<div>
						<h3 class="mb-2 text-center text-sm font-medium">{filename}</h3>
						<div class="bg-muted rounded-lg p-4" style="height: 300px;">
							<AiAvatarCanvas {emotionState} {theme} {filename} />
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Beállítások -->
		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-semibold">Beállítások</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Válaszd ki a kategóriát és a hozzáférési kört
			</p>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="category-select" class="mb-1 block text-sm font-medium">Kategória</label>
					<select
						id="category-select"
						bind:value={selectedCategory}
						class="border-input bg-background w-full rounded-md border px-3 py-2"
					>
						<option value="test-uploads">test-uploads</option>
						<option value="backgrounds">backgrounds</option>
						<option value="avatars">avatars</option>
						<option value="documents">documents</option>
					</select>
				</div>
				<div>
					<label for="scope-select" class="mb-1 block text-sm font-medium">Scope</label>
					<select
						id="scope-select"
						bind:value={selectedScope}
						class="border-input bg-background w-full rounded-md border px-3 py-2"
					>
						<option value="user">user (saját fájlok)</option>
						<option value="shared">shared (közös)</option>
					</select>
				</div>
			</div>
			<button
				onclick={refreshFileList}
				class="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2"
				disabled={isLoadingFiles}
			>
				{isLoadingFiles ? 'Betöltés...' : 'Fájlok frissítése'}
			</button>
		</div>

		<!-- Instant mód példák -->
		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-semibold">🚀 Instant Mód</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Azonnali feltöltés kompakt kinézettel - ideális avatar vagy egyedi fájl feltöltéshez
			</p>

			<div class="space-y-6">
				<!-- Instant Avatar Upload -->
				<div>
					<h3 class="mb-2 text-sm font-medium">Avatar feltöltés (instant)</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<FileUploader
								mode="instant"
								category={selectedCategory}
								scope={selectedScope}
								fileType="image"
								maxFiles={1}
								maxFileSize={5 * 1024 * 1024}
								generateThumbnail={true}
								onUploadStart={handleInstantUploadStart}
								onUploadComplete={handleInstantUploadComplete}
								onError={handleInstantUploadError}
							/>
						</div>
						<div>
							{#if isInstantUploading}
								<div class="bg-muted flex h-full items-center justify-center rounded-lg p-4">
									<div class="text-center">
										<svg
											class="text-primary mx-auto mb-2 h-8 w-8 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<p class="text-muted-foreground text-sm">Feltöltés folyamatban...</p>
									</div>
								</div>
							{:else if instantUploadedFile}
								<div class="bg-muted rounded-lg p-4">
									<div class="mb-2 flex items-center justify-between">
										<p class="text-sm font-medium">Feltöltött fájl:</p>
										<button
											onclick={clearInstantUpload}
											class="text-muted-foreground hover:text-foreground text-xs"
										>
											Törlés
										</button>
									</div>
									<div class="flex items-center gap-3">
										<img
											src={instantUploadedFile.thumbnailUrl || instantUploadedFile.url}
											alt={instantUploadedFile.filename}
											class="h-16 w-16 rounded object-cover"
										/>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium">
												{instantUploadedFile.filename}
											</p>
											<a
												href={instantUploadedFile.url}
												target="_blank"
												class="text-primary text-xs hover:underline"
											>
												Megnyitás
											</a>
										</div>
									</div>
								</div>
							{:else}
								<div class="bg-muted flex h-full items-center justify-center rounded-lg p-4">
									<p class="text-muted-foreground text-sm">Válassz egy fájlt a feltöltéshez</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Instant Document Upload -->
				<div>
					<h3 class="mb-2 text-sm font-medium">Dokumentum feltöltés (instant)</h3>
					<FileUploader
						mode="instant"
						category={selectedCategory}
						scope={selectedScope}
						fileType="document"
						maxFiles={1}
						maxFileSize={10 * 1024 * 1024}
						onUploadStart={handleInstantUploadStart}
						onUploadComplete={handleInstantUploadComplete}
						onError={handleInstantUploadError}
					/>
				</div>

				<!-- Instant Mixed Upload -->
				<div>
					<h3 class="mb-2 text-sm font-medium">Bármilyen fájl (instant)</h3>
					<FileUploader
						mode="instant"
						category={selectedCategory}
						scope={selectedScope}
						fileType="mixed"
						maxFiles={1}
						maxFileSize={20 * 1024 * 1024}
						onUploadStart={handleInstantUploadStart}
						onUploadComplete={handleInstantUploadComplete}
						onError={handleInstantUploadError}
					/>
				</div>
			</div>
		</div>

		<!-- Standard mód példák -->
		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-semibold">📋 Standard Mód</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Klasszikus feltöltés fájl listával és külön feltöltés gombbal
			</p>

			<div class="space-y-6">
				<!-- Képfeltöltő -->
				<div>
					<h3 class="mb-2 text-sm font-medium">Képfeltöltés (több fájl)</h3>
					<FileUploader
						category={selectedCategory}
						scope={selectedScope}
						fileType="image"
						maxFiles={5}
						maxFileSize={5 * 1024 * 1024}
						generateThumbnail={true}
						maxImageWidth={1920}
						maxImageHeight={1080}
						onUploadComplete={handleUploadComplete}
						onError={handleError}
					/>
				</div>

				<!-- Dokumentum feltöltő -->
				<div>
					<h3 class="mb-2 text-sm font-medium">Dokumentum feltöltés (több fájl)</h3>
					<FileUploader
						category={selectedCategory}
						scope={selectedScope}
						fileType="document"
						maxFiles={3}
						maxFileSize={10 * 1024 * 1024}
						onUploadComplete={handleUploadComplete}
						onError={handleError}
					/>
				</div>
			</div>
		</div>

		<!-- Hibaüzenet -->
		{#if lastError}
			<div class="bg-destructive/10 text-destructive rounded-md p-4">
				<strong>Hiba:</strong>
				{lastError}
			</div>
		{/if}

		<!-- Feltöltött fájlok listája -->
		<div class="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
			<h2 class="mb-1 text-lg font-semibold">Feltöltött fájlok</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Kategória: {selectedCategory} | Scope: {selectedScope}
			</p>
			{#if uploadedFiles.length === 0}
				<p class="text-muted-foreground py-8 text-center">
					Még nincsenek feltöltött fájlok ebben a kategóriában.
				</p>
			{:else}
				<div class="space-y-2">
					{#each uploadedFiles as file (file.id)}
						<div class="bg-muted/50 flex items-center gap-4 rounded-md p-3">
							<!-- Előnézet képekhez -->
							{#if file.mimeType.startsWith('image/')}
								<img src={file.url} alt={file.filename} class="h-16 w-16 rounded object-cover" />
							{:else}
								<div class="bg-muted flex h-16 w-16 items-center justify-center rounded">
									<svg
										class="text-muted-foreground h-8 w-8"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</div>
							{/if}

							<!-- Fájl info -->
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium">{file.filename}</p>
								<p class="text-muted-foreground text-sm">{formatFileSize(file.size)}</p>
							</div>

							<!-- Műveletek -->
							<div class="flex gap-2">
								<a
									href={file.url}
									target="_blank"
									class="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-3 py-1 text-sm"
								>
									Megnyitás
								</a>
								<button
									onclick={() => handleDelete(file.id)}
									class="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded px-3 py-1 text-sm"
								>
									Törlés
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
