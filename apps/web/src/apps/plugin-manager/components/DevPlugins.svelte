<!--
	DevPlugins.svelte
	Fejlesztői plugin kezelő oldal a Plugin Manager-ben.
	Csak DEV_MODE=true esetén érhető el.

	Workflow:
	1. Plugin fejlesztő buildeli a plugint (vite build)
	2. Elindítja a dev szervert (bun dev-server.ts)
	3. Megadja az URL-t (pl. http://localhost:5174)
	4. A rendszer betölti a manifest.json-t és az IIFE bundle-t
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import DevPluginLoader from './DevPluginLoader.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Trash2, ExternalLink, Code, Play } from 'lucide-svelte/icons';
	import { toast } from 'svelte-sonner';
	import { useI18n } from '$lib/i18n/hooks';
	import { getWindowManager } from '$lib/stores';

	const { t } = useI18n();
	const windowManager = getWindowManager();

	interface DevPlugin {
		id: string;
		name: Record<string, string> | string;
		version: string;
		devUrl: string;
		entry: string;
		loadedAt: Date;
	}

	let devPlugins = $state<DevPlugin[]>([]);

	function getPluginDisplayName(plugin: DevPlugin): string {
		if (typeof plugin.name === 'string') return plugin.name;
		return plugin.name?.en ?? plugin.name?.hu ?? plugin.id;
	}

	function handleDevPluginLoaded(event: CustomEvent<DevPlugin>) {
		const pluginData = event.detail;
		if (!pluginData?.id) return;

		const existingIndex = devPlugins.findIndex((p) => p.id === pluginData.id);
		if (existingIndex >= 0) {
			devPlugins[existingIndex] = { ...pluginData, loadedAt: new Date() };
			toast.info(`Plugin "${getPluginDisplayName(pluginData)}" frissítve`);
		} else {
			devPlugins = [...devPlugins, { ...pluginData, loadedAt: new Date() }];
		}
	}

	function removePlugin(pluginId: string) {
		const plugin = devPlugins.find((p) => p.id === pluginId);
		devPlugins = devPlugins.filter((p) => p.id !== pluginId);
		if (plugin) {
			toast.success(`Plugin "${getPluginDisplayName(plugin)}" eltávolítva`);
		}
	}

	function openPlugin(plugin: DevPlugin) {
		const displayName = getPluginDisplayName(plugin);
		windowManager.openWindow(
			`dev:${plugin.id}`,
			`${displayName} (DEV)`,
			{
				icon: 'Code',
				defaultSize: { width: 800, height: 600 },
				minSize: { width: 400, height: 300 },
				allowMultiple: true
			},
			{
				devUrl: plugin.devUrl,
				entry: plugin.entry
			}
		);
	}

	onMount(() => {
		window.addEventListener('devPluginLoaded', handleDevPluginLoaded as EventListener);
	});

	onDestroy(() => {
		window.removeEventListener('devPluginLoaded', handleDevPluginLoaded as EventListener);
	});
</script>

<div class="title-block">
	<h2>{t('plugin-manager.devPlugins.title')}</h2>
	<h3>{t('plugin-manager.devPlugins.description')}</h3>
</div>

<div class="space-y-6">
	<DevPluginLoader />

	{#if devPlugins.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Code class="h-4 w-4" />
					{t('plugin-manager.devPlugins.loaded')}
					<Badge variant="secondary">{devPlugins.length}</Badge>
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-3">
					{#each devPlugins as plugin (plugin.id)}
						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{getPluginDisplayName(plugin)}</span>
									<Badge variant="outline" class="text-xs">v{plugin.version}</Badge>
									<Badge variant="secondary" class="text-xs">DEV</Badge>
								</div>
								<div class="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
									<ExternalLink class="h-3 w-3" />
									<span class="truncate">{plugin.devUrl}</span>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onclick={() => openPlugin(plugin)}
									title="Megnyitás"
								>
									<Play class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => removePlugin(plugin.id)}
									title="Eltávolítás"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
