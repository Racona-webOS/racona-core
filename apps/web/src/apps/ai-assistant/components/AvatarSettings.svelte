<!--
  AvatarSettings — Avatar beállítások panel.

  Vízszintes elrendezés:
  - Bal oldal: kiválasztott avatar 3D megjelenítése
  - Jobb oldal: beállítások (név, minőség) + telepített avatárok carousel

  Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 9.7
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { mode } from 'mode-watcher';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { useI18n } from '$lib/i18n/hooks';
	import { listAvatars, getAvatarConfig, saveAvatarConfig } from '../avatar.remote.js';
	import type { AiAvatarSelectModel } from '@racona/database/schemas';
	import AvatarHead from './AvatarHead.svelte';
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';

	const { t } = useI18n();
	const aiStore = getAiAssistantStore();

	// -------------------------------------------------------------------------
	// Állapot
	// -------------------------------------------------------------------------

	let avatars = $state<AiAvatarSelectModel[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	// Eredeti konfiguráció (a visszavonáshoz)
	let originalConfig = $state<{
		avatarIdname: string | null;
		quality: 'sd' | 'hd';
		customName: string;
	}>({
		avatarIdname: null,
		quality: 'sd',
		customName: ''
	});

	// Aktuális szerkesztett állapot
	let selectedIdname = $state<string | null>(null);
	let customName = $state('');
	let quality = $state<'sd' | 'hd'>('sd');

	// Téma
	const theme = $derived<'light' | 'dark'>(mode.current === 'dark' ? 'dark' : 'light');

	// Panel referencia az egérkövetéshez
	let panelRef = $state<HTMLDivElement | undefined>();

	// -------------------------------------------------------------------------
	// Betöltés
	// -------------------------------------------------------------------------

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [avatarsResult, configResult] = await Promise.all([listAvatars(), getAvatarConfig()]);

			console.log('[AvatarSettings] loadData - config result:', configResult);

			if (avatarsResult.success) {
				avatars = avatarsResult.avatars;
			}

			// Először nézzük meg, van-e már betöltött avatar a store-ban
			const storeUrl = aiStore.avatarModelUrl;
			let configFromStore: {
				avatarIdname: string;
				quality: 'sd' | 'hd';
				customName: string;
			} | null = null;

			if (storeUrl) {
				// Parse-oljuk ki az idname-t és quality-t az URL-ből
				const match = storeUrl.match(/\/api\/ai-avatar\/([^/]+)\/\1_(sd|hd)\.glb/);
				if (match) {
					const [, idname, qual] = match;
					configFromStore = {
						avatarIdname: idname,
						quality: qual as 'sd' | 'hd',
						customName: '' // A customName-t nem tudjuk az URL-ből kiolvasni
					};
					console.log('[AvatarSettings] loadData - config a store-ból:', configFromStore);
				}
			}

			// Ha van config a store-ban, azt használjuk (ez a legfrissebb)
			// Különben az adatbázisból jövő config-ot
			const effectiveConfig = configFromStore || configResult.config;

			if (effectiveConfig) {
				// Van mentett konfiguráció
				console.log('[AvatarSettings] loadData - beállított konfiguráció:', {
					avatarIdname: effectiveConfig.avatarIdname,
					quality: effectiveConfig.quality,
					customName: effectiveConfig.customName
				});

				originalConfig = {
					avatarIdname: effectiveConfig.avatarIdname,
					quality: effectiveConfig.quality as 'sd' | 'hd',
					customName: effectiveConfig.customName ?? ''
				};
				selectedIdname = originalConfig.avatarIdname;
				quality = originalConfig.quality;
				customName = originalConfig.customName;

				console.log('[AvatarSettings] loadData - state frissítve:', {
					selectedIdname,
					quality,
					customName
				});
			} else {
				// Nincs mentett konfiguráció
				originalConfig = {
					avatarIdname: null,
					quality: 'sd',
					customName: ''
				};
			}
		} catch (err) {
			console.error('[AvatarSettings] Betöltési hiba:', err);
		} finally {
			loading = false;
		}
	}

	// -------------------------------------------------------------------------
	// Kiválasztott avatar adatai
	// -------------------------------------------------------------------------

	const selectedAvatar = $derived(avatars.find((a) => a.idname === selectedIdname) ?? null);

	// Placeholder: manifest display name (Req 4.7)
	const namePlaceholder = $derived(selectedAvatar?.displayName ?? '');

	// Elérhető minőségi szintek a kiválasztott avatarhoz
	const availableQualities = $derived(selectedAvatar?.availableQualities ?? []);

	// Ellenőrizzük, hogy a kiválasztott minőség elérhető-e
	const isQualityAvailable = $derived.by(() => {
		if (!selectedAvatar) return { sd: false, hd: false };
		return {
			sd: availableQualities.includes('sd'),
			hd: availableQualities.includes('hd')
		};
	});

	// Modell URL a preview-hoz
	const previewModelUrl = $derived.by(() => {
		if (!selectedIdname) return undefined;
		return `/api/ai-avatar/${selectedIdname}/${selectedIdname}_${quality}.glb`;
	});

	// Van-e változás az eredeti konfigurációhoz képest
	const hasChanges = $derived(
		selectedIdname !== originalConfig.avatarIdname ||
			quality !== originalConfig.quality ||
			customName !== originalConfig.customName
	);

	// Exportált API a szülő komponens számára
	export const api = {
		get saving() {
			return saving;
		},
		get hasChanges() {
			return hasChanges;
		},
		handleSave() {
			return saveAvatar();
		},
		handleCancel() {
			cancelChanges();
		}
	};

	// -------------------------------------------------------------------------
	// Avatar kiválasztása a listából
	// -------------------------------------------------------------------------

	function selectAvatar(idname: string) {
		selectedIdname = idname;
		const avatar = avatars.find((a) => a.idname === idname);

		// Ha nincs még mentett konfiguráció, akkor az első elérhető minőséggel jelenítjük meg
		if (originalConfig.avatarIdname === null && avatar) {
			// Preferáljuk az SD-t, ha elérhető, különben HD
			quality = avatar.availableQualities.includes('sd') ? 'sd' : 'hd';
		} else if (avatar) {
			// Ha van mentett konfiguráció, de a kiválasztott minőség nem elérhető, válasszuk az első elérhetőt
			if (!avatar.availableQualities.includes(quality)) {
				quality = avatar.availableQualities[0];
			}
		}
	}

	// -------------------------------------------------------------------------
	// Mentés
	// -------------------------------------------------------------------------

	async function saveAvatar() {
		if (!selectedIdname) {
			return { success: false, error: t('ai-assistant.settings.noAvatarSelected') };
		}

		console.log('[AvatarSettings] Mentés indítása:', {
			avatarIdname: selectedIdname,
			quality,
			customName: customName.trim() || null
		});

		saving = true;
		try {
			const result = await saveAvatarConfig({
				avatarIdname: selectedIdname,
				quality,
				customName: customName.trim() || null
			});

			console.log('[AvatarSettings] Mentés eredménye:', result);

			if (result.success) {
				// Frissítjük az eredeti konfigurációt a lokális state-ben
				originalConfig = {
					avatarIdname: selectedIdname,
					quality,
					customName: customName.trim()
				};

				// Frissítjük a store-t is, hogy a taskbar fixed panel is frissüljön
				const modelUrl = `/api/ai-avatar/${selectedIdname}/${selectedIdname}_${quality}.glb`;
				console.log('[AvatarSettings] Avatar mentve, store frissítése:', modelUrl);
				aiStore.setAvatarModelUrl(modelUrl);

				return { success: true };
			} else {
				console.error('[AvatarSettings] Mentés sikertelen:', result.error);
				return { success: false, error: result.error ?? t('ai-assistant.settings.saveError') };
			}
		} catch (err) {
			console.error('[AvatarSettings] Mentési hiba:', err);
			return { success: false, error: t('ai-assistant.settings.saveError') };
		} finally {
			saving = false;
		}
	}

	// -------------------------------------------------------------------------
	// Visszavonás
	// -------------------------------------------------------------------------

	function cancelChanges() {
		selectedIdname = originalConfig.avatarIdname;
		quality = originalConfig.quality;
		customName = originalConfig.customName;
	}
</script>

{#if loading}
	<div
		class="avatar-settings__loading"
		role="status"
		aria-label={t('ai-assistant.settings.loading')}
	>
		<span class="avatar-settings__spinner" aria-hidden="true"></span>
		<span>{t('ai-assistant.settings.loading')}</span>
	</div>
{:else}
	<div class="avatar-settings__container w-full">
		<!-- Bal oldal: 3D avatar preview -->
		<div class="avatar-settings__preview" bind:this={panelRef}>
			{#if selectedIdname}
				{#key `${selectedIdname}-${quality}`}
					<AvatarHead
						emotionState="neutral"
						{theme}
						enableMouseTracking={true}
						{panelRef}
						headAnimationMode="idle"
						modelUrl={previewModelUrl}
					/>
				{/key}
			{:else}
				<div class="avatar-settings__no-selection">
					<p>{t('ai-assistant.settings.noAvatarSelected')}</p>
					<p class="avatar-settings__no-selection-hint">
						{t('ai-assistant.settings.selectAvatar')}
					</p>
				</div>
			{/if}
		</div>

		<!-- Jobb oldal: Beállítások + Avatárok -->
		<div class="avatar-settings__config">
			{#if selectedIdname}
				<!-- Egyéni név -->
				<div class="avatar-settings__field">
					<Label for="avatar-custom-name">{t('ai-assistant.settings.customName')}</Label>
					<Input
						id="avatar-custom-name"
						type="text"
						bind:value={customName}
						placeholder={namePlaceholder}
					/>
				</div>

				<!-- Minőség -->
				<div class="avatar-settings__field">
					<fieldset class="avatar-settings__quality-fieldset">
						<legend class="avatar-settings__quality-legend">
							{t('ai-assistant.settings.quality')}
						</legend>
						<div class="avatar-settings__quality-options">
							{#if isQualityAvailable.sd}
								<label class="avatar-settings__quality-label">
									<input
										type="radio"
										name="avatar-quality"
										value="sd"
										bind:group={quality}
										class="avatar-settings__radio"
									/>
									<span>SD</span>
								</label>
							{/if}
							{#if isQualityAvailable.hd}
								<label class="avatar-settings__quality-label">
									<input
										type="radio"
										name="avatar-quality"
										value="hd"
										bind:group={quality}
										class="avatar-settings__radio"
									/>
									<span>HD</span>
								</label>
							{/if}
						</div>
					</fieldset>
				</div>
			{:else}
				<div class="avatar-settings__no-selection-info">
					<p>{t('ai-assistant.settings.noAvatarSelected')}</p>
					<p class="avatar-settings__no-selection-hint">
						{t('ai-assistant.settings.selectAvatar')}
					</p>
				</div>
			{/if}

			<!-- Telepített avatárok carousel -->
			<div class="avatar-settings__avatars">
				<h3 class="avatar-settings__section-title">
					{t('ai-assistant.settings.installedAvatars')}
				</h3>
				{#if avatars.length === 0}
					<div class="avatar-settings__empty">
						<p>{t('ai-assistant.settings.noAvatarsInstalled')}</p>
					</div>
				{:else}
					<div class="flex justify-center">
						<Carousel.Root
							opts={{
								align: 'start',
								loop: true
							}}
							class="w-[70%]"
						>
							<Carousel.Content class="-ml-2 md:-ml-4">
								{#each avatars as avatar (avatar.idname)}
									<Carousel.Item class="basis-1/3 pl-2 md:basis-1/4 md:pl-4">
										<button
											type="button"
											class="avatar-settings__card"
											class:avatar-settings__card--selected={selectedIdname === avatar.idname}
											onclick={() => selectAvatar(avatar.idname)}
										>
											<img
												src="/api/ai-avatar/{avatar.idname}/{avatar.idname}_cover.jpg"
												alt={avatar.displayName}
												class="avatar-settings__cover"
												loading="lazy"
											/>
											<span class="avatar-settings__card-name">{avatar.displayName}</span>
										</button>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							<Carousel.Previous />
							<Carousel.Next />
						</Carousel.Root>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.avatar-settings__loading {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		height: 100%;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.avatar-settings__spinner {
		display: inline-block;
		animation: spin 0.7s linear infinite;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		width: 1rem;
		height: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ========================================================================
	   Fő konténer
	   ======================================================================== */

	.avatar-settings__container {
		display: flex;
		gap: 1.5rem;
		height: 100%;
		overflow: hidden;
	}

	/* Bal oldal: 3D preview */
	.avatar-settings__preview {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-lg);
		background: var(--color-neutral-50);
		padding: 0 1.5rem;
	}

	:global(.dark) .avatar-settings__preview {
		background: var(--color-neutral-900);
	}

	.avatar-settings__no-selection {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
		text-align: center;
	}

	.avatar-settings__no-selection-hint {
		color: var(--color-neutral-400);
		font-size: 0.8125rem;
	}

	/* Jobb oldal: Beállítások + Avatárok */
	.avatar-settings__config {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 1.25rem;
		overflow-y: auto;
	}

	.avatar-settings__no-selection-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.avatar-settings__field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Minőség */
	.avatar-settings__quality-fieldset {
		margin: 0;
		border: none;
		padding: 0;
	}

	.avatar-settings__quality-legend {
		margin-bottom: 0.5rem;
		color: var(--color-neutral-700);
		font-weight: 500;
		font-size: 0.875rem;
	}

	:global(.dark) .avatar-settings__quality-legend {
		color: var(--color-neutral-300);
	}

	.avatar-settings__quality-options {
		display: flex;
		gap: 1.25rem;
	}

	.avatar-settings__quality-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		cursor: pointer;
		color: var(--color-neutral-700);
		font-size: 0.875rem;
	}

	:global(.dark) .avatar-settings__quality-label {
		color: var(--color-neutral-300);
	}

	.avatar-settings__radio {
		cursor: pointer;
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary-500, #3b82f6);
	}

	/* ========================================================================
	   Telepített avatárok carousel
	   ======================================================================== */

	.avatar-settings__avatars {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: auto;
		border-top: 1px solid var(--color-neutral-200);
		padding-top: 1rem;
	}

	:global(.dark) .avatar-settings__avatars {
		border-top-color: var(--color-neutral-700);
	}

	.avatar-settings__section-title {
		margin: 0;
		color: var(--color-neutral-700);
		font-weight: 600;
		font-size: 0.875rem;
		letter-spacing: 0.02em;
	}

	:global(.dark) .avatar-settings__section-title {
		color: var(--color-neutral-300);
	}

	.avatar-settings__empty {
		padding: 2rem 1rem;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
		text-align: center;
	}

	/* Avatar kártyák */
	.avatar-settings__card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition:
			border-color 0.15s,
			background 0.15s,
			transform 0.15s;
		cursor: pointer;
		border: 2px solid transparent;
		border-radius: var(--radius-md, 0.5rem);
		background: var(--color-neutral-100);
		padding: 0.75rem;
		width: 100%;
		text-align: center;
	}

	:global(.dark) .avatar-settings__card {
		background: var(--color-neutral-800);
	}

	.avatar-settings__card:hover {
		transform: translateY(-2px);
		border-color: var(--color-primary-300, #93c5fd);
		background: var(--color-neutral-50);
	}

	:global(.dark) .avatar-settings__card:hover {
		background: var(--color-neutral-700);
	}

	.avatar-settings__card--selected {
		border-color: var(--color-primary-500, #3b82f6);
		background: var(--color-primary-50, #eff6ff);
	}

	:global(.dark) .avatar-settings__card--selected {
		border-color: var(--color-primary-400, #60a5fa);
		background: var(--color-primary-950, #172554);
	}

	.avatar-settings__cover {
		border-radius: var(--radius-sm, 0.25rem);
		aspect-ratio: 1;
		width: 100%;
		object-fit: cover;
	}

	.avatar-settings__card-name {
		color: var(--color-neutral-700);
		font-weight: 500;
		font-size: 0.8125rem;
		line-height: 1.3;
		word-break: break-word;
	}

	:global(.dark) .avatar-settings__card-name {
		color: var(--color-neutral-300);
	}
</style>
