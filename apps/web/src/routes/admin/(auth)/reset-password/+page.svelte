<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input, PasswordInput } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext, onMount } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t, store } = useI18n();

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
		setAnimating: (value: boolean) => void;
	}>('authDecor');

	$effect(() => {
		if (store.loadedNamespaces.has('auth')) {
			authDecor.setDecorText(t('auth.resetPassword.title'), t('auth.resetPassword.description'));
		}
	});

	onMount(() => {
		// Check for token in URL
		const tokenParam = $page.url.searchParams.get('token');
		const errorParam = $page.url.searchParams.get('error');

		if (errorParam === 'INVALID_TOKEN') {
			status = 'error';
			errorMessage = t('auth.resetPassword.errors.invalidToken');
		} else if (tokenParam) {
			token = tokenParam;
		} else {
			status = 'error';
			errorMessage = t('auth.resetPassword.errors.noToken');
		}
	});

	let token = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let status: 'idle' | 'success' | 'error' = $state('idle');
	let errorMessage = $state('');
	let passwordErrors = $state<string[]>([]);

	const validatePassword = (passwordValue: string): boolean => {
		const errors: string[] = [];

		if (!passwordValue) {
			errors.push(t('auth.resetPassword.errors.passwordRequired'));
			passwordErrors = errors;
			return false;
		}

		if (passwordValue.length < 8) {
			errors.push(t('auth.resetPassword.errors.passwordMinLength'));
		}

		const hasUpperCase = /[A-Z]/.test(passwordValue);
		const hasLowerCase = /[a-z]/.test(passwordValue);
		const hasNumbers = /\d/.test(passwordValue);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

		if (!hasUpperCase) {
			errors.push(t('auth.resetPassword.errors.passwordUppercase'));
		}

		if (!hasLowerCase) {
			errors.push(t('auth.resetPassword.errors.passwordLowercase'));
		}

		if (!hasNumbers) {
			errors.push(t('auth.resetPassword.errors.passwordNumber'));
		}

		if (!hasSpecialChar) {
			errors.push(t('auth.resetPassword.errors.passwordSpecial'));
		}

		passwordErrors = errors;
		return errors.length === 0;
	};

	const validatePasswordMatch = (): boolean => {
		if (!confirmPassword) {
			errorMessage = t('auth.resetPassword.errors.confirmRequired');
			return false;
		}

		if (newPassword !== confirmPassword) {
			errorMessage = t('auth.resetPassword.errors.passwordMismatch');
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		errorMessage = '';
		passwordErrors = [];
		status = 'idle';

		if (!token) {
			status = 'error';
			errorMessage = t('auth.resetPassword.errors.noToken');
			return;
		}

		if (!validatePassword(newPassword)) {
			status = 'error';
			return;
		}

		if (!validatePasswordMatch()) {
			status = 'error';
			return;
		}

		isLoading = true;

		try {
			await authClient.resetPassword({
				newPassword: newPassword,
				token: token
			});

			status = 'success';
			// User will click the button to go to sign-in
		} catch (error: any) {
			console.error('Password reset error:', error);
			status = 'error';

			const errorMsg = error.message?.toLowerCase() || '';

			if (
				errorMsg.includes('token') &&
				(errorMsg.includes('invalid') || errorMsg.includes('expired'))
			) {
				errorMessage = t('auth.resetPassword.errors.invalidToken');
			} else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
				errorMessage = t('auth.resetPassword.errors.network');
			} else {
				errorMessage = t('auth.resetPassword.errors.generic');
			}
		} finally {
			isLoading = false;
		}
	};

	const handleGoToSignIn = () => {
		goto('/admin/sign-in');
	};

	const handleRequestNewLink = () => {
		goto('/admin/forget-password');
	};
</script>

{#if status === 'success'}
	<div class="space-y-4 text-center">
		<div
			class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
		>
			<svg
				class="h-6 w-6 text-green-600 dark:text-green-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<div class="space-y-2">
			<h3 class="text-lg font-medium">{t('auth.resetPassword.success.title')}</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{t('auth.resetPassword.success.message')}
			</p>
		</div>

		<Button class="w-full" onclick={handleGoToSignIn} variant="login">
			{t('auth.resetPassword.success.signIn')}
		</Button>
	</div>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-4"
	>
		{#if status === 'error' && errorMessage}
			<div
				class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
			>
				<div class="flex items-start gap-2">
					<svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clip-rule="evenodd"
						/>
					</svg>
					<div class="flex-1">
						<span>{errorMessage}</span>
						{#if errorMessage.includes(t('auth.resetPassword.errors.invalidToken')) || errorMessage.includes(t('auth.resetPassword.errors.noToken'))}
							<div class="mt-2">
								<Button
									size="sm"
									variant="outline"
									class="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900"
									onclick={handleRequestNewLink}
								>
									{t('auth.resetPassword.requestNewLink')}
								</Button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<div class="grid gap-2">
			<Label for="newPassword">{t('auth.resetPassword.newPassword')}</Label>
			<PasswordInput
				id="newPassword"
				required
				bind:value={newPassword}
				disabled={isLoading || !token}
				class={passwordErrors.length > 0
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: ''}
			/>
			{#if passwordErrors.length > 0}
				<div class="space-y-1">
					{#each passwordErrors as error}
						<div class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
							<svg class="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zM9.25 15a.75.75 0 011.5 0v.01a.75.75 0 01-1.5 0V15z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{error}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
			<PasswordInput
				id="confirmPassword"
				required
				bind:value={confirmPassword}
				disabled={isLoading || !token}
			/>
		</div>

		<Button type="submit" class="w-full" disabled={isLoading || !token} variant="login">
			{#if isLoading}
				<div class="flex items-center">
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
					{t('auth.resetPassword.submitting')}
				</div>
			{:else}
				{t('auth.resetPassword.submit')}
			{/if}
		</Button>

		<Button type="button" variant="outline" class="w-full" onclick={handleGoToSignIn}>
			{t('auth.resetPassword.backToSignIn')}
		</Button>
	</form>
{/if}
