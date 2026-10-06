<script lang="ts">
	/**
	 * FileUploader Svelte 5 komponens
	 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1
	 */

	import { cn } from '$lib/utils/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { T } from '$lib/i18n/components/index.js';
	import { getI18nService } from '$lib/i18n/service.js';
	import {
		type FileUploaderProps,
		type FileItem,
		type UploadResult,
		type ProcessedFile,
		DEFAULT_CONFIG
	} from './types.js';
	import {
		validateFiles,
		getAllowedExtensions,
		describeUploadError,
		ERROR_MESSAGES
	} from './validation.js';
	import { saveFile } from '$lib/storage/save-file.remote.js';
	import { formatBytes } from '$lib/storage/limits.js';

	// ============================================================================
	// Props
	// ============================================================================

	let {
		category,
		scope,
		mode = 'standard',
		maxFileSize = DEFAULT_CONFIG.maxFileSize,
		maxFiles = DEFAULT_CONFIG.maxFiles,
		fileType = DEFAULT_CONFIG.fileType,
		allowedExtensions = DEFAULT_CONFIG.allowedExtensions,
		generateThumbnail = DEFAULT_CONFIG.generateThumbnail,
		maxImageWidth = DEFAULT_CONFIG.maxImageWidth,
		maxImageHeight = DEFAULT_CONFIG.maxImageHeight,
		showInstructions = DEFAULT_CONFIG.showInstructions,
		onUploadComplete,
		onError,
		onUploadStart
	}: FileUploaderProps = $props();

	// Get the i18n service
	const i18nService = getI18nService();

	// ============================================================================
	// State
	// ============================================================================

	let files = $state<FileItem[]>([]);
	let isDragging = $state(false);
	let isUploading = $state(false);
	let errorMessage = $state<string | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// Abort controllers for cancellation
	let abortControllers = $state<Map<string, AbortController>>(new Map());

	// ============================================================================
	// Derived
	// ============================================================================

	const effectiveAllowedExtensions = $derived(getAllowedExtensions(allowedExtensions, fileType));
	const acceptAttribute = $derived(
		effectiveAllowedExtensions.length > 0
			? effectiveAllowedExtensions.map((ext) => `.${ext}`).join(',')
			: '*'
	);
	const isMultiple = $derived(maxFiles > 1);

	// ============================================================================
	// Helper Functions
	// ============================================================================

	/**
	 * Egyedi azonosító generálása
	 */
	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Fájl konvertálása Base64 stringgé
	 */
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Fájlméret formázása olvasható formátumba
	 */
	const formatFileSize = formatBytes;

	// ============================================================================
	// File Handling
	// ============================================================================

	/**
	 * Fájlok hozzáadása a listához validáció után
	 */
	function addFiles(newFiles: FileList | File[]) {
		errorMessage = null;
		const fileArray = Array.from(newFiles);

		// Validáció
		const totalFiles = files.length + fileArray.length;
		const validation = validateFiles(fileArray, {
			maxFileSize,
			maxFiles: maxFiles - files.length, // Remaining slots
			allowedExtensions,
			fileType
		});

		// Fájlszám ellenőrzés a teljes listára
		if (totalFiles > maxFiles) {
			errorMessage = ERROR_MESSAGES.TOO_MANY_FILES;
			onError?.({
				code: 'TOO_MANY_FILES',
				message: ERROR_MESSAGES.TOO_MANY_FILES
			});
			return;
		}

		if (!validation.valid) {
			errorMessage = validation.errors[0]?.message || 'Validációs hiba';
			onError?.({
				code: validation.errors[0]?.code || 'VALIDATION_ERROR',
				message: validation.errors[0]?.message || 'Validációs hiba'
			});
			return;
		}

		// Instant módban azonnal feltöltjük a fájlt
		if (mode === 'instant') {
			const file = fileArray[0];
			if (file) {
				uploadInstantFile(file);
			}
			return;
		}

		// Standard módban hozzáadjuk a listához
		const newFileItems: FileItem[] = fileArray.map((file) => ({
			id: generateId(),
			file,
			status: 'pending' as const,
			progress: 0
		}));

		files = [...files, ...newFileItems];
	}

	/**
	 * Fájl eltávolítása a listából
	 */
	function removeFile(id: string) {
		// Cancel upload if in progress
		const controller = abortControllers.get(id);
		if (controller) {
			controller.abort();
			abortControllers.delete(id);
		}

		files = files.filter((f) => f.id !== id);
		errorMessage = null;
	}

	/**
	 * Egyetlen fájl feltöltése
	 */
	async function uploadSingleFile(fileItem: FileItem): Promise<UploadResult> {
		const controller = new AbortController();
		abortControllers.set(fileItem.id, controller);

		try {
			// Update status to uploading
			files = files.map((f) =>
				f.id === fileItem.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
			);

			// Convert to base64
			const base64Data = await fileToBase64(fileItem.file);

			// Update progress
			files = files.map((f) => (f.id === fileItem.id ? { ...f, progress: 30 } : f));

			// Check if cancelled
			if (controller.signal.aborted) {
				return { success: false, error: 'Upload cancelled' };
			}

			// Call saveFile remote function with category and scope
			const result = await saveFile({
				fileData: base64Data,
				fileName: fileItem.file.name,
				mimeType: fileItem.file.type || 'application/octet-stream',
				category,
				scope,
				options: {
					generateThumbnail,
					maxImageWidth,
					maxImageHeight
				}
			});

			// Update progress to complete
			files = files.map((f) => (f.id === fileItem.id ? { ...f, progress: 100 } : f));

			if (result.success && result.file) {
				// Convert StoredFile to ProcessedFile for compatibility
				const processedFile: ProcessedFile = {
					id: result.file.id,
					originalName: result.file.originalName,
					mimeType: result.file.mimeType,
					size: result.file.size,
					url: result.file.url,
					filename: result.file.filename,
					thumbnailUrl: result.file.thumbnailUrl
				};

				files = files.map((f) =>
					f.id === fileItem.id ? { ...f, status: 'completed' as const, result: processedFile } : f
				);

				return { success: true, file: processedFile };
			} else {
				files = files.map((f) =>
					f.id === fileItem.id ? { ...f, status: 'error' as const, error: result.error } : f
				);
				return { success: false, error: result.error };
			}
		} catch (error) {
			const errorMsg = describeUploadError(error, fileItem.file.size, 'Upload failed');
			files = files.map((f) =>
				f.id === fileItem.id ? { ...f, status: 'error' as const, error: errorMsg } : f
			);
			return { success: false, error: errorMsg };
		} finally {
			abortControllers.delete(fileItem.id);
		}
	}

	/**
	 * Instant mód: fájl azonnali feltöltése
	 */
	async function uploadInstantFile(file: File) {
		isUploading = true;
		errorMessage = null;
		onUploadStart?.();

		try {
			// Convert to base64
			const base64Data = await fileToBase64(file);

			// Call saveFile remote function
			const result = await saveFile({
				fileData: base64Data,
				fileName: file.name,
				mimeType: file.type || 'application/octet-stream',
				category,
				scope,
				options: {
					generateThumbnail,
					maxImageWidth,
					maxImageHeight
				}
			});

			if (result.success && result.file) {
				// Convert StoredFile to ProcessedFile
				const processedFile: ProcessedFile = {
					id: result.file.id,
					originalName: result.file.originalName,
					mimeType: result.file.mimeType,
					size: result.file.size,
					url: result.file.url,
					filename: result.file.filename,
					thumbnailUrl: result.file.thumbnailUrl
				};

				onUploadComplete?.({ success: true, file: processedFile });
			} else {
				errorMessage = result.error || 'Feltöltés sikertelen';
				onError?.({
					code: 'UPLOAD_ERROR',
					message: result.error || 'Feltöltés sikertelen'
				});
			}
		} catch (error) {
			const errorMsg = describeUploadError(error, file.size);
			errorMessage = errorMsg;
			onError?.({
				code: 'UPLOAD_ERROR',
				message: errorMsg
			});
		} finally {
			isUploading = false;
		}
	}

	/**
	 * Összes pending fájl feltöltése
	 */
	async function uploadAllFiles() {
		const pendingFiles = files.filter((f) => f.status === 'pending');
		if (pendingFiles.length === 0) return;

		isUploading = true;
		errorMessage = null;

		for (const fileItem of pendingFiles) {
			const result = await uploadSingleFile(fileItem);
			if (result.success) {
				onUploadComplete?.(result);
			} else if (result.error !== 'Upload cancelled') {
				onError?.({
					code: 'UPLOAD_ERROR',
					message: result.error || 'Upload failed'
				});
			}
		}

		isUploading = false;
	}

	/**
	 * Feltöltés megszakítása
	 */
	function cancelUpload(id: string) {
		const controller = abortControllers.get(id);
		if (controller) {
			controller.abort();
		}
		files = files.map((f) => (f.id === id ? { ...f, status: 'pending' as const, progress: 0 } : f));
	}

	/**
	 * Összes feltöltés megszakítása
	 */
	function cancelAllUploads() {
		abortControllers.forEach((controller) => controller.abort());
		abortControllers.clear();
		files = files.map((f) =>
			f.status === 'uploading' ? { ...f, status: 'pending' as const, progress: 0 } : f
		);
		isUploading = false;
	}

	// ============================================================================
	// Event Handlers
	// ============================================================================

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;

		const droppedFiles = e.dataTransfer?.files;
		if (droppedFiles && droppedFiles.length > 0) {
			addFiles(droppedFiles);
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			addFiles(input.files);
			// Reset input to allow selecting the same file again
			input.value = '';
		}
	}

	function handleBrowseClick() {
		fileInputRef?.click();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleBrowseClick();
		}
	}

	// ============================================================================
	// Status helpers
	// ============================================================================

	function getStatusKey(status: FileItem['status']): string {
		switch (status) {
			case 'pending':
				return 'common.fileUpload.status.pending';
			case 'uploading':
				return 'common.fileUpload.status.uploading';
			case 'completed':
				return 'common.fileUpload.status.completed';
			case 'error':
				return 'common.fileUpload.status.error';
			default:
				return '';
		}
	}

	function getStatusColor(status: FileItem['status']): string {
		switch (status) {
			case 'pending':
				return 'text-muted-foreground';
			case 'uploading':
				return 'text-blue-500';
			case 'completed':
				return 'text-green-500';
			case 'error':
				return 'text-red-500';
			default:
				return '';
		}
	}
</script>

<div class="file-uploader w-full">
	<!-- Hidden file input -->
	<input
		bind:this={fileInputRef}
		type="file"
		accept={acceptAttribute}
		multiple={isMultiple && mode === 'standard'}
		class="hidden"
		onchange={handleFileSelect}
		aria-hidden="true"
		tabindex="-1"
	/>

	{#if mode === 'instant'}
		<!-- Instant Upload Mode: Compact UI -->
		<div class="space-y-2">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class={cn(
					'relative flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors',
					isDragging
						? 'border-primary bg-primary/5'
						: 'border-muted-foreground/25 hover:border-muted-foreground/50',
					isUploading && 'pointer-events-none opacity-50'
				)}
				ondragenter={handleDragEnter}
				ondragleave={handleDragLeave}
				ondragover={handleDragOver}
				ondrop={handleDrop}
				role="button"
				tabindex="0"
				onkeydown={handleKeyDown}
				aria-label="Fájl feltöltés. Húzd ide a fájlt vagy kattints a kiválasztáshoz."
			>
				<!-- Upload icon -->
				<div class="shrink-0">
					<svg
						class="text-muted-foreground h-8 w-8"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
				</div>

				<!-- Info and button -->
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">
						{#if isUploading}
							<T key="common.fileUpload.uploadingInProgress" />
						{:else}
							<T key="common.fileUpload.clickOrDrag" />
						{/if}
					</p>
					{#if showInstructions}
						<p class="text-muted-foreground/70 truncate text-xs">
							{#if effectiveAllowedExtensions.length > 0}
								{effectiveAllowedExtensions.join(', ')}
							{:else}
								<T key="common.fileUpload.allFileTypes" />
							{/if}
							• <T key="common.fileUpload.max" />: {formatFileSize(maxFileSize)}
						</p>
					{/if}
				</div>

				<!-- Browse button -->
				<Button
					variant="outline"
					size="sm"
					onclick={handleBrowseClick}
					disabled={isUploading}
					class="shrink-0"
				>
					{#if isUploading}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
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
					{/if}
					<T key="common.fileUpload.browse" />
				</Button>
			</div>

			<!-- Error message -->
			{#if errorMessage}
				<div
					class="bg-destructive/10 text-destructive rounded-md p-3 text-sm"
					role="alert"
					aria-live="polite"
				>
					{errorMessage}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Standard Mode: Original UI with file list -->
		<!-- Drop zone -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class={cn(
				'drop-zone relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
				isDragging
					? 'border-primary bg-primary/5'
					: 'border-muted-foreground/25 hover:border-muted-foreground/50',
				files.length > 0 && 'pb-4'
			)}
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onkeydown={handleKeyDown}
			aria-label="Fájl feltöltési zóna. Húzd ide a fájlokat vagy nyomd meg az Enter-t a böngészéshez."
		>
			<!-- Upload icon -->
			<svg
				class="text-muted-foreground mb-4 h-12 w-12"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
				/>
			</svg>

			<!-- Instructions -->
			<p class="text-muted-foreground mb-2 text-sm">
				<T key="common.fileUpload.dragFilesHere" html />
				<T key="common.fileUpload.orClickToBrowse" />
			</p>
			{#if showInstructions}
				<p class="text-muted-foreground/70 text-xs">
					{#if effectiveAllowedExtensions.length > 0}
						<T key="common.fileUpload.allowed" />: {effectiveAllowedExtensions.join(', ')}
					{:else}
						<T key="common.fileUpload.allFileTypesAllowed" />
					{/if}
					• <T key="common.fileUpload.max" />: {formatFileSize(maxFileSize)}
					{#if maxFiles > 1}
						• <T key="common.fileUpload.maxFiles" params={{ count: maxFiles }} />
					{/if}
				</p>
			{/if}

			<!-- Browse button -->
			<Button
				variant="outline"
				size="sm"
				class="mt-4"
				onclick={handleBrowseClick}
				disabled={isUploading}
			>
				<T key="common.fileUpload.browseFiles" />
			</Button>
		</div>

		<!-- Error message -->
		{#if errorMessage}
			<div
				class="bg-destructive/10 text-destructive mt-2 rounded-md p-3 text-sm"
				role="alert"
				aria-live="polite"
			>
				{errorMessage}
			</div>
		{/if}

		<!-- File list -->
		{#if files.length > 0}
			<div class="mt-4 space-y-2" role="list">
				{#each files as fileItem (fileItem.id)}
					<div class="bg-card flex items-center gap-3 rounded-md border p-3" role="listitem">
						<!-- File icon -->
						<div class="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
							<svg
								class="text-muted-foreground h-5 w-5"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>

						<!-- File info -->
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{fileItem.file.name}</p>
							<div class="text-muted-foreground flex items-center gap-2 text-xs">
								<span>{formatFileSize(fileItem.file.size)}</span>
								<span>•</span>
								<span class={getStatusColor(fileItem.status)}>
									<T key={getStatusKey(fileItem.status)} />
								</span>
								{#if fileItem.error}
									<span class="text-destructive">- {fileItem.error}</span>
								{/if}
							</div>

							<!-- Progress bar -->
							{#if fileItem.status === 'uploading'}
								<div class="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
									<div
										class="bg-primary h-full transition-all duration-300"
										style="width: {fileItem.progress}%"
										role="progressbar"
										aria-valuenow={fileItem.progress}
										aria-valuemin={0}
										aria-valuemax={100}
									></div>
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="flex shrink-0 gap-1">
							{#if fileItem.status === 'uploading'}
								<button
									type="button"
									class="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
									onclick={() => cancelUpload(fileItem.id)}
									title={i18nService.t('common.fileUpload.cancelUpload')}
								>
									<svg
										class="h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							{:else}
								<button
									type="button"
									class="text-muted-foreground hover:bg-muted hover:text-destructive rounded p-1"
									onclick={() => removeFile(fileItem.id)}
									title={i18nService.t('common.fileUpload.removeFile')}
								>
									<svg
										class="h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Upload button -->
			{#if files.some((f) => f.status === 'pending')}
				<div class="mt-4 flex gap-2">
					<Button onclick={uploadAllFiles} disabled={isUploading} class="flex-1">
						{#if isUploading}
							<T key="common.fileUpload.uploadingInProgress" />
						{:else}
							<T
								key="common.fileUpload.uploadFiles"
								params={{ count: files.filter((f) => f.status === 'pending').length }}
							/>
						{/if}
					</Button>
					{#if isUploading}
						<Button variant="outline" onclick={cancelAllUploads}>
							<T key="common.fileUpload.cancel" />
						</Button>
					{/if}
				</div>
			{/if}
		{/if}
	{/if}
</div>
