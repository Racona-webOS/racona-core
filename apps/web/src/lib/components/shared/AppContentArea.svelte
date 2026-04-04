<script lang="ts">
	import { untrack } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	interface Props {
		appName: string;
		component: string | null;
		props?: Record<string, any>;
		isPlugin?: boolean;
	}

	let { appName, component, props = {}, isPlugin = false }: Props = $props();

	// Vite glob import az összes app komponenshez
	const appComponentModules = import.meta.glob('/src/apps/*/components/*.svelte') as Record<
		string,
		() => Promise<{ default: any }>
	>;

	let loadedComponent = $state<any>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Track the last loaded component name to avoid reloading
	let lastLoadedComponent = $state<string | null>(null);
	let isLoadingComponent = $state(false);

	$effect(() => {
		const currentComponent = component;
		console.log('[AppContentArea] Effect triggered:', {
			currentComponent,
			lastLoadedComponent,
			isLoadingComponent,
			isPlugin,
			appName
		});

		// Guard: ne töltsünk be újra, ha már töltünk vagy már be van töltve
		if (isLoadingComponent) {
			console.log('[AppContentArea] Already loading, skipping');
			return;
		}

		if (currentComponent && currentComponent !== lastLoadedComponent) {
			untrack(() => loadComponent(currentComponent));
		} else if (!currentComponent) {
			untrack(() => {
				loadedComponent = null;
				error = null;
				lastLoadedComponent = null;
			});
		}
	});

	async function loadComponent(name: string) {
		console.log('[AppContentArea] Loading component:', name, 'isPlugin:', isPlugin);

		if (isLoadingComponent) {
			console.log('[AppContentArea] Already loading, aborting');
			return;
		}

		isLoadingComponent = true;
		loading = true;
		error = null;

		try {
			if (isPlugin) {
				// Plugin komponens betöltése API-n keresztül
				await loadPluginComponent(name);
			} else {
				// Beépített app komponens betöltése
				const moduleKey = `/src/apps/${appName}/components/${name}.svelte`;
				const moduleLoader = appComponentModules[moduleKey];

				if (!moduleLoader) {
					throw new Error(`Komponens nem található: ${name} (${appName})`);
				}

				const module = await moduleLoader();
				loadedComponent = module.default;
				lastLoadedComponent = name;
			}
		} catch (e) {
			console.error(`Failed to load component: ${name} from app: ${appName}`, e);
			error = `Nem sikerült betölteni a komponenst: ${name}`;
			loadedComponent = null;
			lastLoadedComponent = null;
		} finally {
			loading = false;
			isLoadingComponent = false;
			console.log('[AppContentArea] Loading finished');
		}
	}

	async function loadPluginComponent(componentName: string) {
		try {
			// Egyedi factory function név a komponenshez
			const factoryName = `${appName.replace(/-/g, '_')}_Component_${componentName}`;
			let componentFactory = (window as any)[factoryName];

			// Ha a factory már elérhető a window-on (pl. dev módban már betöltötte a windowStore),
			// akkor közvetlenül használjuk, nem kell API fetch
			if (componentFactory && typeof componentFactory === 'function') {
				console.log('[AppContentArea] Factory already on window, using directly:', factoryName);
			} else {
				// Plugin komponens betöltése az API-n keresztül (production mód)
				console.log('[AppContentArea] Fetching plugin component from API:', componentName);
				const response = await fetch(`/api/plugins/${appName}/components/${componentName}`);
				if (!response.ok) {
					throw new Error(`Failed to load plugin component: ${response.statusText}`);
				}

				const code = await response.text();
				console.log('[AppContentArea] Plugin component code received, length:', code.length);

				// Komponens kód futtatása
				const script = document.createElement('script');
				script.textContent = code;
				document.head.appendChild(script);

				componentFactory = (window as any)[factoryName];
				if (!componentFactory || typeof componentFactory !== 'function') {
					throw new Error(`Plugin component factory '${factoryName}' not found`);
				}
			}

			// Factory meghívása
			console.log('[AppContentArea] Calling factory function:', factoryName);
			const componentInfo = componentFactory();
			const tagName = componentInfo.tagName;
			console.log('[AppContentArea] Plugin component tag name:', tagName);

			// Custom element tag name tárolása
			loadedComponent = {
				__pluginTagName: tagName,
				__pluginProps: props
			} as any;
			lastLoadedComponent = componentName;
			console.log('[AppContentArea] Plugin component loaded successfully');
		} catch (error) {
			console.error(`Failed to load plugin component ${componentName}:`, error);
			throw error;
		}
	}
</script>

<div class="app-content-area">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>{t('desktop.contentArea.loading')}</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
		</div>
	{:else if loadedComponent}
		{#if (loadedComponent as any).__pluginTagName}
			<!-- Plugin custom element renderelése -->
			<svelte:element
				this={(loadedComponent as any).__pluginTagName}
				{...{ 'plugin-id': appName }}
				{...props}
			/>
		{:else}
			<!-- Normál Svelte komponens renderelése -->
			{@const Component = loadedComponent}
			<Component {...props} />
		{/if}
	{:else}
		<div class="placeholder">
			<p>{t('desktop.contentArea.selectMenuItem')}</p>
		</div>
	{/if}
</div>

<style>
	.app-content-area {
		width: 100%;
		height: 100%;
	}

	.loading,
	.placeholder {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		height: 100%;
		color: var(--color-neutral-500);
	}

	.loading p,
	.placeholder p {
		font-size: 0.875rem;
	}

	.error {
		margin: 1rem;
		border: 1px solid var(--color-red-200);
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-red-50);
		padding: 1rem;
		color: var(--color-red-700);
	}

	:global(.dark) .error {
		border-color: var(--color-red-700);
		background-color: var(--color-red-900);
		color: var(--color-red-200);
	}

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
</style>
