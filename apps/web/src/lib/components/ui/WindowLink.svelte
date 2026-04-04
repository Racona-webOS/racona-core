<script lang="ts">
	import { CopyPlus, ClipboardPaste, MessageCircleQuestionMark } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import LZString from 'lz-string';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import { getWindowManager } from '$lib/stores';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	let appGuid = $state('');
	let popoverOpen = $state(false);

	const windowManager = getWindowManager();

	$effect(() => {
		if (!popoverOpen) {
			appGuid = '';
		}
	});

	async function paste() {
		const linkData = await navigator.clipboard.readText();
		appGuid = linkData;
		open();
	}

	async function open() {
		try {
			const jsonString = LZString.decompressFromEncodedURIComponent(appGuid);
			const appData = JSON.parse(jsonString);
			if (appData) {
				const app = await getAppByName(appData.appName);
				if (app) {
					windowManager.openWindow(app.appName, app.title, app, appData.parameters);
					appGuid = '';
					popoverOpen = false;
				}
			} else {
				appGuid = '';
				toast.error('Hibás alkalmazás guid hivatkotás');
			}
		} catch (error) {
			toast.error('Hibás formátum');
			appGuid = '';
			return null;
		}
	}

	async function help() {
		const helpApp = await getAppByName('help');
		if (helpApp) {
			windowManager.openWindow(helpApp.appName, helpApp.title, helpApp, {
				helpId: 1000
			});
		}
	}
</script>

<Tooltip.Provider>
	<Popover.Root bind:open={popoverOpen}>
		<Tooltip.Root ignoreNonKeyboardFocus>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Popover.Trigger {...props} class="taskbar-function-icon btn-click-effect"
						><CopyPlus size={20} />
					</Popover.Trigger>
				{/snippet}
			</Tooltip.Trigger>
			<Popover.Content class="z-1000 mx-2 my-2 w-[600px] ">
				<p class="prose-sm flex items-center gap-2 pb-2 leading-7 text-(--color-muted-foreground)">
					<span>{t('common.windowLink.title')}</span>
					<button onclick={help}
						><MessageCircleQuestionMark size={16} class="text-primary" /></button
					>
				</p>
				<div class="flex items-center gap-2">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="outline" onclick={async () => paste()}><ClipboardPaste /></Button>
							</Tooltip.Trigger>
							<Tooltip.Content class="z-1001">{t('common.windowLink.pasteAndOpen')}</Tooltip.Content
							>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Input
						name="appGuidInput"
						placeholder={t('common.windowLink.placeholder')}
						bind:value={appGuid}
						class="text-xs"
						autocomplete="off"
					/>
					<Button variant="outline" onclick={open} disabled={appGuid.length === 0}
						>{t('common.windowLink.open')}</Button
					>
				</div>
			</Popover.Content>
			<Tooltip.Content class="z-1001" interactOutsideBehavior="defer-otherwise-close"
				>{t('common.windowLink.title')}</Tooltip.Content
			>
		</Tooltip.Root>
	</Popover.Root>
</Tooltip.Provider>
