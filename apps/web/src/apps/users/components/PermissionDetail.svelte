<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { useI18n } from '$lib/i18n/hooks';

	interface Props {
		permissionId: number;
	}

	let { permissionId }: Props = $props();

	const shell = getAppShell();
	const { t } = useI18n();

	function handleBack() {
		shell.navigateTo('PermissionList');
	}
</script>

<div class="title-block">
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" class="size-8" onclick={handleBack}>
			<ArrowLeft class="size-4" />
			<span class="sr-only">{t('common.buttons.back')}</span>
		</Button>
		<h2>{t('users.permissions.detail.title')}</h2>
	</div>
</div>

<div class="flex items-center justify-center py-8">
	<p class="text-muted-foreground">TODO: Jogosultság részletek (ID: {permissionId})</p>
</div>
