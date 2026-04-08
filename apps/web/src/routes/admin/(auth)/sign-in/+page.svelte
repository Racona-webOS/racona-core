<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { checkUserExists } from '$lib/auth/check-user.remote';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageData } from './$types';
	import { getContext } from 'svelte';
	import { useI18n } from '$lib/i18n/hooks';

	let { data }: { data: PageData } = $props();

	const { t, store } = useI18n();

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
		setAnimating: (value: boolean) => void;
	}>('authDecor');

	// Reaktívan frissítjük a decor szöveget amikor az auth namespace betöltődik
	$effect(() => {
		if (store.loadedNamespaces.has('auth')) {
			authDecor.setDecorText(t('auth.signIn.title'), t('auth.signIn.description'));
		}
	});

	let email = $state('');
	let password = $state('');
	let otpCode = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let showVerificationPrompt = $state(false);
	let useEmailOTP = $state(false);
	let otpSent = $state(false);

	// Show info notice only if coming from registration or if there's a verification error
	let showInfoNotice = $derived(data.registered || showVerificationPrompt);

	const handleSignIn = async () => {
		isLoading = true;
		errorMessage = '';
		showVerificationPrompt = false;

		try {
			const result = await authClient.signIn.email({
				email: email,
				password: password
			});

			// Először ellenőrizzük a hibát
			if (result.error) {
				const error = result.error;
				const msg = error.message?.toLowerCase() || '';

				// Check if the error is related to email verification
				if (
					msg.includes('verify') ||
					msg.includes('verification') ||
					msg.includes('confirm') ||
					msg.includes('not verified') ||
					error.code === 'EMAIL_NOT_VERIFIED'
				) {
					showVerificationPrompt = true;
					errorMessage = t('auth.signIn.errors.emailNotVerified');
				} else if (msg === 'invalid email') {
					errorMessage = t('auth.signIn.errors.invalidEmail');
				} else if (
					msg.includes('invalid email or password') ||
					msg.includes('invalid credentials')
				) {
					errorMessage = t('auth.signIn.errors.invalidCredentials');
				} else if (msg.includes('user') && msg.includes('not found')) {
					errorMessage = t('auth.signIn.errors.userNotFound');
				} else if (msg.includes('account') && msg.includes('locked')) {
					errorMessage = t('auth.signIn.errors.accountLocked');
				} else if (msg.includes('rate') || msg.includes('limit')) {
					errorMessage = t('auth.signIn.errors.rateLimit');
				} else {
					errorMessage = error.message || t('auth.signIn.errors.generic');
				}
				isLoading = false;
				return;
			}

			// 2FA redirect kezelése - animáció nélkül, simán átnavigálunk
			if ((result.data as any)?.twoFactorRedirect) {
				window.location.href = '/admin/verify-2fa';
				return;
			}

			// Sikeres bejelentkezés
			authDecor.setAnimating(true);
			setTimeout(() => {
				window.location.href = '/admin';
			}, 600);
		} catch (error: any) {
			console.error('signIn error:', error);
			errorMessage = error.message || t('auth.signIn.errors.generic');
			isLoading = false;
		}
	};

	const handleSendEmailOTP = async () => {
		if (!email) {
			errorMessage = t('auth.signIn.errors.invalidEmail');
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Először ellenőrizzük, hogy létezik-e a felhasználó
			const userExists = await checkUserExists({ email });

			if (!userExists) {
				errorMessage = t('auth.signIn.errors.userNotFound');
				isLoading = false;
				return;
			}

			await authClient.emailOtp.sendVerificationOtp({
				email: email,
				type: 'sign-in'
			});
			otpSent = true;
			errorMessage = '';
		} catch (error: any) {
			errorMessage = error.message || t('auth.signIn.errors.generic');
		} finally {
			isLoading = false;
		}
	};

	const handleVerifyEmailOTP = async () => {
		if (!email || !otpCode) {
			errorMessage = t('auth.signIn.emailOtp.errors.codeRequired');
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			await authClient.signIn.emailOtp({
				email: email,
				otp: otpCode
			});

			authDecor.setAnimating(true);
			setTimeout(() => {
				window.location.href = '/admin';
			}, 600);
		} catch (error: any) {
			errorMessage = error.message || t('auth.signIn.emailOtp.errors.invalidCode');
		} finally {
			isLoading = false;
		}
	};

	const handleResendVerification = () => {
		window.location.href = `/resend-verification?email=${encodeURIComponent(email)}`;
	};

	const toggleSignInMethod = () => {
		useEmailOTP = !useEmailOTP;
		otpSent = false;
		otpCode = '';
		password = '';
		errorMessage = '';
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !isLoading) {
			event.preventDefault();
			if (useEmailOTP) {
				if (otpSent) {
					handleVerifyEmailOTP();
				} else {
					handleSendEmailOTP();
				}
			} else {
				handleSignIn();
			}
		}
	};
</script>

<!-- Email verification info notice - only show when relevant -->
{#if showInfoNotice}
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
				<p class="font-medium">{t('auth.signIn.verification.title')}</p>
				<p class="mt-1 text-xs">
					{#if data.registered}
						{t('auth.signIn.verification.registered')}
					{:else}
						{t('auth.signIn.verification.required')}
					{/if}
				</p>
			</div>
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
			<div class="flex-1">
				<span>{errorMessage}</span>
				{#if showVerificationPrompt}
					<div class="mt-3 space-y-2">
						<p class="text-xs text-red-700 dark:text-red-300">
							{t('auth.signIn.verification.checkSpam')}
						</p>
						<div class="flex flex-col gap-2 sm:flex-row">
							<Button
								size="sm"
								variant="outline"
								class="border-red-300 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900"
								onclick={handleResendVerification}
							>
								{t('auth.signIn.verification.resend')}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								class="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
								onclick={() => (window.location.href = '/admin/sign-up')}
							>
								{t('auth.signIn.verification.newAccount')}
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if useEmailOTP}
	<!-- Email OTP Sign-in -->
	<div class="grid gap-2">
		<Label for="email">{t('auth.signIn.email')}</Label>
		<Input
			id="email"
			type="email"
			placeholder={t('auth.signIn.emailPlaceholder')}
			required
			bind:value={email}
			disabled={otpSent}
			onkeydown={handleKeyDown}
		/>
	</div>

	{#if otpSent}
		<div class="grid gap-2">
			<Label for="otp">{t('auth.signIn.emailOtp.code')}</Label>
			<Input
				id="otp"
				type="text"
				placeholder={t('auth.signIn.emailOtp.codePlaceholder')}
				required
				bind:value={otpCode}
				maxlength={6}
				onkeydown={handleKeyDown}
			/>
			<p class="text-muted-foreground text-xs">{t('auth.signIn.emailOtp.codeHint')}</p>
		</div>

		<Button
			type="button"
			class="w-full"
			onclick={handleVerifyEmailOTP}
			disabled={isLoading}
			variant="login"
		>
			{#if isLoading}
				<div class="flex items-center">
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
					{t('auth.signIn.submitting')}
				</div>
			{:else}
				{t('auth.signIn.emailOtp.verify')}
			{/if}
		</Button>

		<Button type="button" variant="outline" class="w-full" onclick={handleSendEmailOTP}>
			{t('auth.signIn.emailOtp.resend')}
		</Button>
	{:else}
		<Button
			type="button"
			class="w-full"
			onclick={handleSendEmailOTP}
			disabled={isLoading}
			variant="login"
		>
			{#if isLoading}
				<div class="flex items-center">
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
					{t('auth.signIn.submitting')}
				</div>
			{:else}
				{t('auth.signIn.emailOtp.send')}
			{/if}
		</Button>
	{/if}

	<Button type="button" variant="ghost" class="w-full" onclick={toggleSignInMethod}>
		{t('auth.signIn.emailOtp.usePassword')}
	</Button>
{:else}
	<!-- Password Sign-in -->
	<div class="grid gap-2">
		<Label for="email">{t('auth.signIn.email')}</Label>
		<Input
			id="email"
			type="email"
			placeholder={t('auth.signIn.emailPlaceholder')}
			required
			bind:value={email}
			onkeydown={handleKeyDown}
		/>
	</div>
	<div class="grid gap-2">
		<div class="flex items-center">
			<Label for="password">{t('auth.signIn.password')}</Label>
			<a href="/admin/forget-password" class="ml-auto inline-block text-sm underline">
				{t('auth.signIn.forgotPassword')}
			</a>
		</div>
		<Input id="password" type="password" required bind:value={password} onkeydown={handleKeyDown} />
	</div>
	<Button type="button" class="w-full" onclick={handleSignIn} disabled={isLoading} variant="login">
		{#if isLoading}
			<div class="flex items-center">
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
				{t('auth.signIn.submitting')}
			</div>
		{:else}
			{t('auth.signIn.submit')}
		{/if}
	</Button>

	<Button type="button" variant="ghost" class="w-full" onclick={toggleSignInMethod}>
		{t('auth.signIn.emailOtp.useEmailCode')}
	</Button>
{/if}
{#if data.socialLoginEnabled}
	<Button
		variant="outline"
		class="w-full"
		onclick={async () => {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/admin'
			});
		}}>{t('auth.signIn.googleSignIn')}</Button
	>
{/if}
{#if data.registrationEnabled}
	<div class="mt-4 text-center text-sm">
		{t('auth.signIn.noAccount')}
		<a href="/admin/sign-up" class="underline">{t('auth.signIn.register')}</a>
	</div>
{/if}
