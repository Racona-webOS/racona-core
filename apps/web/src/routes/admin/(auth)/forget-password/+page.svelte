<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authClient } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t, store } = useI18n();

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
	}>('authDecor');

	$effect(() => {
		if (store.loadedNamespaces.has('auth')) {
			authDecor.setDecorText(t('auth.forgotPassword.title'), t('auth.forgotPassword.description'));
		}
	});

	let email = $state('');
	let isLoading = $state(false);
	let status: 'idle' | 'success' | 'error' = $state('idle');
	let errorMessage = $state('');

	const validateEmail = (emailValue: string): boolean => {
		if (!emailValue.trim()) {
			errorMessage = t('auth.forgotPassword.errors.emailRequired');
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailValue)) {
			errorMessage = t('auth.forgotPassword.errors.emailInvalid');
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		errorMessage = '';
		status = 'idle';

		if (!validateEmail(email)) {
			status = 'error';
			return;
		}

		isLoading = true;

		try {
			// Use Better Auth's forgetPassword method (note: it's "forget" not "forgot")
			const result = await authClient.requestPasswordReset({
				email: email.trim(),
				redirectTo: `${window.location.origin}/admin/reset-password`
			});

			// Check for errors in the response
			if (result.error) {
				throw new Error(result.error.message || 'Failed to send password reset email');
			}

			// Better Auth returns success even if user doesn't exist (security best practice)
			status = 'success';
		} catch (error: any) {
			console.error('Password reset request error:', error);
			status = 'error';

			const errorMsg = error.message?.toLowerCase() || '';

			if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
				errorMessage = t('auth.forgotPassword.errors.network');
			} else if (errorMsg.includes('rate') || errorMsg.includes('limit')) {
				errorMessage = t('auth.forgotPassword.errors.rateLimit');
			} else {
				errorMessage = t('auth.forgotPassword.errors.generic');
			}
		} finally {
			isLoading = false;
		}
	};

	const handleGoToSignIn = () => {
		goto('/admin/sign-in');
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
			<h3 class="text-lg font-medium">{t('auth.forgotPassword.success.title')}</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{t('auth.forgotPassword.success.message', { email })}
			</p>
		</div>

		<div class="rounded-md bg-blue-50 p-4 text-sm dark:bg-blue-950">
			<div class="flex items-start gap-3">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="text-blue-800 dark:text-blue-200">
					<p class="mb-2 font-medium">{t('auth.forgotPassword.success.nextSteps')}</p>
					<ol class="list-inside list-decimal space-y-1 text-xs">
						<li>{t('auth.forgotPassword.success.step1')}</li>
						<li>{t('auth.forgotPassword.success.step2')}</li>
						<li>{t('auth.forgotPassword.success.step3')}</li>
					</ol>
				</div>
			</div>
		</div>

		<Button variant="outline" class="w-full" onclick={handleGoToSignIn}>
			{t('auth.forgotPassword.backToSignIn')}
		</Button>

		<p class="text-xs text-gray-500">{t('auth.forgotPassword.success.checkSpam')}</p>
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
				<div class="flex items-center gap-2">
					<svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

		<div class="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950">
			<div class="flex items-start gap-2">
				<svg class="mt-0.5 h-4 w-4 shrink-0 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="text-blue-800 dark:text-blue-200">
					<p class="text-xs">{t('auth.forgotPassword.info')}</p>
				</div>
			</div>
		</div>

		<div class="grid gap-2">
			<Label for="email">{t('auth.forgotPassword.email')}</Label>
			<Input
				id="email"
				type="email"
				placeholder={t('auth.forgotPassword.emailPlaceholder')}
				required
				bind:value={email}
				disabled={isLoading}
			/>
		</div>

		<Button type="submit" class="w-full" disabled={isLoading} variant="login">
			{#if isLoading}
				<div class="flex items-center">
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
					{t('auth.forgotPassword.submitting')}
				</div>
			{:else}
				{t('auth.forgotPassword.submit')}
			{/if}
		</Button>

		<Button type="button" variant="outline" class="w-full" onclick={handleGoToSignIn}>
			{t('auth.forgotPassword.backToSignIn')}
		</Button>
	</form>
{/if}
