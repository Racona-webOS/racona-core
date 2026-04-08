<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { getContext } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t, store } = useI18n();

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
		setAnimating: (value: boolean) => void;
	}>('authDecor');

	$effect(() => {
		if (store.loadedNamespaces.has('auth')) {
			authDecor.setDecorText(t('auth.verify2fa.title'), t('auth.verify2fa.description'));
		}
	});

	let code = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let useBackupCode = $state(false);
	let useOTP = $state(false);
	let trustDevice = $state(false);

	const handleVerifyOTP = async () => {
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await authClient.twoFactor.verifyOtp({
				code: code,
				trustDevice: trustDevice
			});

			if (result.error) {
				const msg = result.error.message?.toLowerCase() || '';
				if (msg.includes('invalid') || msg.includes('incorrect')) {
					errorMessage = t('auth.verify2fa.errors.invalidCode');
				} else if (msg.includes('expired')) {
					errorMessage = t('auth.verify2fa.errors.expiredCode');
				} else {
					errorMessage = result.error.message || t('auth.verify2fa.errors.generic');
				}
				isLoading = false;
				return;
			}

			// Sikeres verifikáció
			authDecor.setAnimating(true);
			setTimeout(() => {
				window.location.href = '/admin';
			}, 600);
		} catch (error: any) {
			console.error('verifyOtp error:', error);
			errorMessage = error.message || t('auth.verify2fa.errors.generic');
			isLoading = false;
		}
	};

	const handleVerifyTOTP = async () => {
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await authClient.twoFactor.verifyTotp({
				code: code,
				trustDevice: trustDevice
			});

			console.log('verifyTotp result:', result);

			if (result.error) {
				const msg = result.error.message?.toLowerCase() || '';
				if (msg.includes('invalid') || msg.includes('incorrect')) {
					errorMessage = t('auth.verify2fa.errors.invalidCode');
				} else if (msg.includes('expired')) {
					errorMessage = t('auth.verify2fa.errors.expiredCode');
				} else {
					errorMessage = result.error.message || t('auth.verify2fa.errors.generic');
				}
				isLoading = false;
				return;
			}

			// Sikeres verifikáció - ha van session vagy user a válaszban
			authDecor.setAnimating(true);
			setTimeout(() => {
				window.location.href = '/admin';
			}, 600);
		} catch (error: any) {
			console.error('verifyTotp error:', error);
			errorMessage = error.message || t('auth.verify2fa.errors.generic');
			isLoading = false;
		}
	};

	const handleVerifyBackupCode = async () => {
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		await authClient.twoFactor.verifyBackupCode(
			{
				code: code,
				trustDevice: trustDevice
			},
			{
				onSuccess() {
					authDecor.setAnimating(true);
					setTimeout(() => {
						window.location.href = '/admin';
					}, 600);
				},
				onError(context) {
					const error = context.error;
					errorMessage = error.message || t('auth.verify2fa.errors.invalidBackupCode');
					isLoading = false;
				}
			}
		);
	};

	const handleVerify = async () => {
		if (useBackupCode) {
			await handleVerifyBackupCode();
		} else if (useOTP) {
			await handleVerifyOTP();
		} else {
			await handleVerifyTOTP();
		}
	};

	const handleSendOTP = async () => {
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		await authClient.twoFactor.sendOtp(
			{},
			{
				onSuccess() {
					successMessage = t('auth.verify2fa.otpSent');
					useOTP = true;
					isLoading = false;
				},
				onError(context) {
					errorMessage = context.error.message || t('auth.verify2fa.errors.otpSendFailed');
					isLoading = false;
				}
			}
		);
	};
</script>

{#if successMessage}
	<div
		class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
	>
		<div class="flex items-start gap-2">
			<svg class="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>{successMessage}</span>
		</div>
	</div>
{/if}
{#if errorMessage}
	<div
		class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
	>
		<div class="flex items-start gap-2">
			<svg class="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>{errorMessage}</span>
		</div>
	</div>
{/if}

<div class="grid gap-4">
	<div class="grid gap-2">
		<Label for="code">
			{useBackupCode ? t('auth.verify2fa.backupCode') : t('auth.verify2fa.code')}
		</Label>
		<Input
			id="code"
			type="text"
			placeholder={useBackupCode
				? t('auth.verify2fa.backupCodePlaceholder')
				: t('auth.verify2fa.codePlaceholder')}
			required
			bind:value={code}
			maxlength={useBackupCode ? 12 : 6}
		/>
		<p class="text-muted-foreground text-xs">
			{#if useBackupCode}
				{t('auth.verify2fa.backupCodeHint')}
			{:else if useOTP}
				Add meg az emailben kapott 6 számjegyű kódot
			{:else}
				{t('auth.verify2fa.codeHint')}
			{/if}
		</p>
	</div>

	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			id="trustDevice"
			bind:checked={trustDevice}
			class="h-4 w-4 rounded border-gray-300"
		/>
		<Label for="trustDevice" class="cursor-pointer text-sm font-normal">
			{t('auth.verify2fa.trustDevice')}
		</Label>
	</div>

	<Button type="button" class="w-full" onclick={handleVerify} disabled={isLoading} variant="login">
		{#if isLoading}
			<div class="flex items-center">
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
				{t('auth.verify2fa.verifying')}
			</div>
		{:else}
			{t('auth.verify2fa.submit')}
		{/if}
	</Button>

	<div class="flex flex-col gap-2">
		<Button
			type="button"
			variant="outline"
			class="w-full"
			onclick={() => (useBackupCode = !useBackupCode)}
		>
			{useBackupCode ? t('auth.verify2fa.useAuthenticator') : t('auth.verify2fa.useBackupCode')}
		</Button>

		<Button type="button" variant="ghost" class="w-full" onclick={handleSendOTP}>
			{t('auth.verify2fa.sendOTP')}
		</Button>
	</div>

	<div class="mt-4 text-center text-sm">
		<a href="/admin/sign-in" class="underline">{t('auth.verify2fa.backToSignIn')}</a>
	</div>
</div>
