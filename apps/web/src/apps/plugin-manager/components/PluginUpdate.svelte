<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Upload, X, RefreshCw, Loader2, ArrowLeft } from 'lucide-svelte/icons';
	import { useI18n } from '$lib/i18n/hooks';

	interface Props {
		pluginId: string;
		currentVersion: string;
		pluginName: string;
		onSuccess?: (oldVersion: string, newVersion: string) => void;
		onCancel?: () => void;
	}

	let { pluginId, currentVersion, pluginName, onSuccess, onCancel }: Props = $props();

	const { t } = useI18n();

	// Elfogadott fájltípusok és méretkorlát (Requirements: 9.2, 9.6)
	const ACCEPTED_EXTENSIONS = ['.raconapkg', '.zip'];
	const MAX_SIZE_MB = 50;
	const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

	/**
	 * Verzió kinyerése a fájlnévből (pl. my-plugin-1.2.3.raconapkg → '1.2.3').
	 * Ha nem található, null-t ad vissza.
	 */
	function extractVersionFromFilename(filename: string): string | null {
		const match = filename.match(/[_\-v](\d+\.\d+\.\d+)(?:\.|$)/i);
		return match ? match[1] : null;
	}

	// Lépés-alapú állapot: select → preview → updating
	type Step = 'select' | 'preview' | 'updating';
	let step = $state<Step>('select');

	// Fájl input referencia (bind:this, ugyanolyan minta, mint PluginUpload.svelte-ben)
	let fileInputEl: HTMLInputElement | undefined = $state();

	// Kiválasztott fájl és kinyert verzió
	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);
	let extractedVersion = $state<string | null>(null);

	// Frissítés folyamatban állapot
	let isUpdating = $state(false);

	// Hibakezelés (Requirement: 9.4)
	let errorMessage = $state<string | null>(null);
	let errorDismissed = $state(false);
	const showError = $derived(errorMessage !== null && !errorDismissed);

	// -------------------------------------------------------------------------
	// Fájlkezelő függvények
	// -------------------------------------------------------------------------

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) validateAndSelect(file);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) validateAndSelect(file);
	}

	/**
	 * Kliens oldali előellenőrzés: kiterjesztés és fájlméret (Requirement: 9.6).
	 * Érvényes fájl esetén a preview lépésre lép.
	 */
	function validateAndSelect(file: File) {
		const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => file.name.endsWith(ext));
		if (!hasValidExtension) {
			errorMessage = t('plugin-manager.update.errors.invalidExtension', {
				extensions: ACCEPTED_EXTENSIONS.join(', ')
			});
			errorDismissed = false;
			return;
		}
		if (file.size > MAX_SIZE_BYTES) {
			errorMessage = t('plugin-manager.update.errors.fileTooLarge', {
				maxSize: MAX_SIZE_MB,
				actualSize: (file.size / (1024 * 1024)).toFixed(2)
			});
			errorDismissed = false;
			return;
		}
		selectedFile = file;
		extractedVersion = extractVersionFromFilename(file.name);
		errorMessage = null;
		errorDismissed = false;
		step = 'preview';
	}

	function triggerFileInput() {
		fileInputEl?.click();
	}

	/** Visszaállítás a fájlválasztó lépésre */
	function resetToSelect() {
		selectedFile = null;
		extractedVersion = null;
		errorMessage = null;
		errorDismissed = false;
		step = 'select';
		if (fileInputEl) fileInputEl.value = '';
	}

	function dismissError() {
		errorDismissed = true;
	}

	// -------------------------------------------------------------------------
	// Frissítés végrehajtása (Requirement: 9.3, 8.1)
	// -------------------------------------------------------------------------

	/**
	 * Megerősítés után PUT /api/plugins/{pluginId} hívás FormData-val.
	 * Sikeres esetén onSuccess callbacket hív (Requirement: 9.3).
	 * Hiba esetén hibaüzenetet jelenít meg (Requirement: 9.4).
	 */
	async function confirmUpdate() {
		if (!selectedFile) return;
		isUpdating = true;
		step = 'updating';
		errorMessage = null;
		errorDismissed = false;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const response = await fetch(`/api/plugins/${pluginId}`, {
				method: 'PUT',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Sikeres frissítés — onSuccess callback meghívása (Requirement: 9.3)
				onSuccess?.(result.oldVersion, result.newVersion);
			} else {
				// Hiba — üzenet összeállítása és visszaállítás a preview lépésre (Requirement: 9.4)
				const errors = result.errors
					? result.errors
							.map((e: { message?: string; code?: string }) => e.message || e.code)
							.join(', ')
					: result.error;
				errorMessage = errors || t('plugin-manager.update.errors.updateFailed');
				errorDismissed = false;
				step = 'preview';
			}
		} catch {
			errorMessage = t('plugin-manager.update.errors.networkError');
			errorDismissed = false;
			step = 'preview';
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="update-container">
	<!-- 1. lépés: Fájl kiválasztása (Requirement: 9.2) -->
	{#if step === 'select'}
		<Card.Root>
			<Card.Header>
				<Card.Title>{t('plugin-manager.update.selectTitle')}</Card.Title>
				<Card.Description>
					{t('plugin-manager.update.selectDescription', { pluginName, currentVersion })}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Rejtett fájl input -->
				<input
					bind:this={fileInputEl}
					type="file"
					accept={ACCEPTED_EXTENSIONS.join(',')}
					onchange={handleFileSelect}
					class="hidden"
				/>

				<!-- Drag & Drop zóna -->
				<div
					class="rounded-lg border-2 border-dashed p-8 text-center transition-colors {isDragging
						? 'border-primary bg-primary/5'
						: 'border-muted-foreground/25 hover:border-muted-foreground/50'}"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					role="button"
					tabindex="0"
					aria-label={t('plugin-manager.update.dragDropLabel')}
					onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
				>
					<Upload class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<p class="mb-2 text-sm font-medium">{t('plugin-manager.update.dragDropText')}</p>
					<p class="text-muted-foreground mb-4 text-xs">
						{t('plugin-manager.update.acceptedFormats', {
							formats: ACCEPTED_EXTENSIONS.join(', '),
							maxSize: MAX_SIZE_MB
						})}
					</p>
					<Button onclick={triggerFileInput} variant="outline">
						{t('plugin-manager.update.browseFiles')}
					</Button>
				</div>

				<!-- Validációs hibaüzenet (Requirement: 9.6) -->
				{#if showError}
					<div class="bg-destructive/10 border-destructive rounded-lg border p-4">
						<div class="flex items-start gap-3">
							<X class="text-destructive h-5 w-5 shrink-0" />
							<p class="text-destructive flex-1 text-sm">{errorMessage}</p>
							<button
								onclick={dismissError}
								class="text-destructive/70 hover:text-destructive"
								aria-label={t('common.buttons.close')}
							>
								<X class="h-4 w-4" />
							</button>
						</div>
					</div>
				{/if}

				<!-- Mégsem gomb -->
				{#if onCancel}
					<div class="flex justify-end">
						<Button onclick={onCancel} variant="ghost">{t('common.buttons.cancel')}</Button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 2. lépés: Előnézet és megerősítés (Requirement: 9.2) -->
	{:else if step === 'preview'}
		<Card.Root>
			<Card.Header>
				<Card.Title>{t('plugin-manager.update.previewTitle')}</Card.Title>
				<Card.Description>{t('plugin-manager.update.previewDescription')}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Frissítési összefoglaló: pluginName, currentVersion, új verzió (Requirement: 9.2) -->
				<div class="bg-muted/50 space-y-3 rounded-lg border p-4">
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.update.preview.pluginName')}</span>
						<span class="info-value font-medium">{pluginName}</span>
					</div>
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.update.preview.currentVersion')}</span>
						<span class="info-value font-mono">{currentVersion}</span>
					</div>
					{#if extractedVersion}
						<div class="info-row">
							<span class="info-label">{t('plugin-manager.update.preview.newVersion')}</span>
							<span class="info-value font-mono text-green-600 dark:text-green-400">
								{extractedVersion}
							</span>
						</div>
					{/if}
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.update.preview.selectedFile')}</span>
						<span class="info-value text-muted-foreground truncate text-sm"
							>{selectedFile?.name}</span
						>
					</div>
					{#if selectedFile}
						<div class="info-row">
							<span class="info-label">{t('plugin-manager.update.preview.fileSize')}</span>
							<span class="info-value text-muted-foreground text-sm">
								{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
							</span>
						</div>
					{/if}
				</div>

				<!-- Frissítési hibaüzenet (Requirement: 9.4) -->
				{#if showError}
					<div class="bg-destructive/10 border-destructive rounded-lg border p-4">
						<div class="flex items-start gap-3">
							<X class="text-destructive h-5 w-5 shrink-0" />
							<p class="text-destructive flex-1 text-sm">{errorMessage}</p>
							<button
								onclick={dismissError}
								class="text-destructive/70 hover:text-destructive"
								aria-label={t('common.buttons.close')}
							>
								<X class="h-4 w-4" />
							</button>
						</div>
					</div>
				{/if}

				<!-- Akciógombok -->
				<div class="flex gap-2">
					<!-- Frissítés megerősítése gomb (Requirement: 9.2) -->
					<Button onclick={confirmUpdate} disabled={isUpdating} class="flex-1">
						<RefreshCw class="mr-2 h-4 w-4" />
						{t('plugin-manager.update.confirmButton')}
					</Button>
					<!-- Vissza a fájlválasztóhoz -->
					<Button onclick={resetToSelect} variant="outline" disabled={isUpdating}>
						<ArrowLeft class="mr-2 h-4 w-4" />
						{t('plugin-manager.update.backButton')}
					</Button>
					{#if onCancel}
						<Button onclick={onCancel} variant="ghost" disabled={isUpdating}>
							{t('common.buttons.cancel')}
						</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Frissítés folyamatban jelzés (Requirement: 9.2 — betöltési állapot) -->
	{:else if step === 'updating'}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center space-y-4 py-12">
				<Loader2 class="text-primary h-10 w-10 animate-spin" aria-hidden="true" />
				<p class="text-muted-foreground text-sm">{t('plugin-manager.update.updating')}</p>
				<p class="text-muted-foreground text-xs">{t('plugin-manager.update.updatingHint')}</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<style>
	.update-container {
		max-width: 36rem;
	}

	.info-row {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.info-label {
		color: var(--color-neutral-500);
		font-weight: 500;
		font-size: 0.75rem;
	}

	.info-value {
		font-size: 0.9375rem;
	}
</style>
