<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAuthConfig, updateAuthConfig } from '../auth-config.remote';

	const { t } = useI18n();

	// State
	let isLoading = $state(false);
	let isSaving = $state(false);

	// Form state
	let registrationEnabled = $state(true);
	let socialLoginEnabled = $state(true);

	onMount(async () => {
		await loadConfig();
	});

	async function loadConfig() {
		isLoading = true;
		try {
			const result = await getAuthConfig();

			if (result.success && result.config) {
				registrationEnabled = result.config.registrationEnabled;
				socialLoginEnabled = result.config.socialLoginEnabled;
			} else {
				toast.error(result.error || t('settings.admin.auth.loadError'));
			}
		} catch (error) {
			console.error('Error loading auth config:', error);
			toast.error(t('settings.admin.auth.loadError'));
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		if (isSaving) return;

		isSaving = true;
		try {
			const result = await updateAuthConfig({
				registrationEnabled,
				socialLoginEnabled
			});

			if (result.success) {
				toast.success(t('settings.admin.auth.saveSuccess'));
			} else {
				toast.error(result.error || t('settings.admin.auth.saveError'));
			}
		} catch (error) {
			console.error('Error saving auth config:', error);
			toast.error(t('settings.admin.auth.saveError'));
		} finally {
			isSaving = false;
		}
	}

	function handleRegistrationChange(checked: boolean) {
		registrationEnabled = checked;
		handleSave();
	}

	function handleSocialLoginChange(checked: boolean) {
		socialLoginEnabled = checked;
		handleSave();
	}
</script>

<div class="space-y-6">
	<ContentSection
		title={t('settings.admin.auth.title')}
		description={t('settings.admin.auth.description')}
		contentPosition="bottom"
	>
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="text-muted-foreground">{t('common.loading')}</div>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Regisztráció engedélyezése -->
				<div class="flex items-center justify-between space-x-4">
					<div class="flex-1 space-y-1">
						<Label for="registration-enabled">
							{t('settings.admin.auth.registrationEnabled')}
						</Label>
						<p class="text-muted-foreground text-sm">
							{t('settings.admin.auth.registrationEnabledDescription')}
						</p>
					</div>
					<Switch
						id="registration-enabled"
						checked={registrationEnabled}
						onCheckedChange={handleRegistrationChange}
					/>
				</div>

				<!-- Social login engedélyezése -->
				<div class="flex items-center justify-between space-x-4">
					<div class="flex-1 space-y-1">
						<Label for="social-login-enabled">
							{t('settings.admin.auth.socialLoginEnabled')}
						</Label>
						<p class="text-muted-foreground text-sm">
							{t('settings.admin.auth.socialLoginEnabledDescription')}
						</p>
					</div>
					<Switch
						id="social-login-enabled"
						checked={socialLoginEnabled}
						onCheckedChange={handleSocialLoginChange}
					/>
				</div>
			</div>
		{/if}
	</ContentSection>
</div>
