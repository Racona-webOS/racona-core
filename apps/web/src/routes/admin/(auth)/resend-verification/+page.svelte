<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext, onMount, onDestroy } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t, store } = useI18n();

	let email = $state('');

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
	}>('authDecor');

	$effect(() => {
		if (store.loadedNamespaces.has('common')) {
			authDecor.setDecorText(t('resend.title'), t('resend.description'));
		}
	});

	// Pre-fill email from URL parameter
	onMount(() => {
		const emailParam = $page.url.searchParams.get('email');
		if (emailParam) {
			email = emailParam;
		}
	});

	let isLoading = $state(false);
	let status = $state<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
	let message = $state('');
	let countdown = $state(0);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	async function handleResendVerification(event: Event) {
		event.preventDefault();
		if (!email.trim()) {
			status = 'error';
			message = t('resend.errors.emailRequired');
			return;
		}

		if (!isValidEmail(email)) {
			status = 'error';
			message = t('resend.errors.emailInvalid');
			return;
		}

		isLoading = true;
		status = 'idle';
		message = '';

		try {
			const response = await fetch('/api/auth/send-verification-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: email.trim(),
					callbackURL: `${window.location.origin}/admin/verify-email`
				})
			});

			if (response.ok) {
				status = 'success';
				message = t('resend.success');
				startCountdown(60); // 60 seconds cooldown
			} else {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 429) {
					status = 'rate_limited';
					message = t('resend.errors.rateLimit');
					const retryAfter = response.headers.get('Retry-After');
					if (retryAfter) {
						startCountdown(parseInt(retryAfter));
					} else {
						startCountdown(60);
					}
				} else if (response.status === 404) {
					status = 'error';
					message = t('resend.errors.notFound');
				} else if (response.status === 400) {
					status = 'error';
					message = errorData.message || t('resend.errors.alreadyVerified');
				} else {
					status = 'error';
					message = errorData.message || t('resend.errors.generic');
				}
			}
		} catch (error) {
			console.error('Resend verification error:', error);
			status = 'error';
			message = t('resend.errors.network');
		} finally {
			isLoading = false;
		}
	}

	function startCountdown(seconds: number) {
		countdown = seconds;
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(countdownInterval!);
				countdownInterval = null;
			}
		}, 1000);
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function handleGoToSignIn() {
		goto('/admin/sign-in');
	}

	function handleGoToSignUp() {
		goto('/admin/sign-up');
	}

	// Cleanup interval on component destroy
	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});
</script>

<form onsubmit={handleResendVerification} class="space-y-4">
	<div class="space-y-2">
		<Label for="email">{t('resend.email')}</Label>
		<Input
			id="email"
			type="email"
			bind:value={email}
			placeholder={t('resend.emailPlaceholder')}
			disabled={isLoading || countdown > 0}
			required
		/>
	</div>

	{#if status === 'success'}
		<div class="rounded-md border border-green-200 bg-green-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-green-800">
						{message}
					</p>
				</div>
			</div>
		</div>
	{:else if status === 'error'}
		<div class="rounded-md border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-red-800">
						{message}
					</p>
				</div>
			</div>
		</div>
	{:else if status === 'rate_limited'}
		<div class="rounded-md border border-orange-200 bg-orange-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-orange-800">
						{message}
						{#if countdown > 0}
							<br />{t('resend.retryIn', { seconds: countdown })}
						{/if}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<Button type="submit" class="w-full" disabled={isLoading || countdown > 0}>
		{#if isLoading}
			<div class="flex items-center">
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
				{t('resend.submitting')}
			</div>
		{:else if countdown > 0}
			{t('resend.retryIn', { seconds: countdown })}
		{:else}
			{t('resend.submit')}
		{/if}
	</Button>
</form>

<div class="space-y-2 text-center">
	<Button variant="outline" onclick={handleGoToSignIn} class="w-full">
		{t('resend.backToSignIn')}
	</Button>
	<p class="text-sm text-gray-500">
		{t('resend.noAccount')}
		<button
			type="button"
			onclick={handleGoToSignUp}
			class="text-blue-600 underline hover:text-blue-500"
		>
			{t('resend.register')}
		</button>
	</p>
</div>

<div class="text-center">
	<p class="text-sm text-gray-500">{t('resend.checkSpam')}</p>
</div>
