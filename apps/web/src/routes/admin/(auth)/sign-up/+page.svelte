<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { writable, derived } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { useI18n } from '$lib/i18n/hooks';
	import { getContext } from 'svelte';

	const { t, store } = useI18n();

	const authDecor = getContext<{
		setDecorText: (title: string, description: string) => void;
	}>('authDecor');

	$effect(() => {
		if (store.loadedNamespaces.has('auth')) {
			authDecor.setDecorText(t('auth.signUp.title'), t('auth.signUp.description'));
		}
	});

	// Form state stores
	const name = writable('');
	const email = writable('');
	const password = writable('');
	const confirmPassword = writable('');
	const isLoading = writable(false);

	// Error state store with typed interface
	interface ValidationErrors {
		name: string;
		email: string;
		password: string;
		confirmPassword: string;
		general: string;
	}

	const errors = writable<ValidationErrors>({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		general: ''
	});

	// Derived store to check if form is valid
	const isFormValid = derived(
		[name, email, password, confirmPassword, errors],
		([$name, $email, $password, $confirmPassword, $errors]) => {
			return (
				$name.trim() !== '' &&
				$email.trim() !== '' &&
				$password.trim() !== '' &&
				$confirmPassword.trim() !== '' &&
				!$errors.name &&
				!$errors.email &&
				!$errors.password &&
				!$errors.confirmPassword
			);
		}
	);

	// Helper function to set specific field error
	const setFieldError = (field: keyof ValidationErrors, message: string) => {
		errors.update((current) => ({
			...current,
			[field]: message
		}));
	};

	// Validation functions
	const validateName = (nameValue: string): string => {
		if (!nameValue.trim()) {
			return t('auth.signUp.errors.nameRequired');
		}

		if (nameValue.trim().length < 2) {
			return t('auth.signUp.errors.nameMinLength');
		}

		return '';
	};

	const validateEmail = (emailValue: string): string => {
		if (!emailValue.trim()) {
			return t('auth.signUp.errors.emailRequired');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailValue)) {
			return t('auth.signUp.errors.emailInvalid');
		}

		return '';
	};

	const validatePassword = (passwordValue: string): string => {
		if (!passwordValue) {
			return t('auth.signUp.errors.passwordRequired');
		}

		if (passwordValue.length < 8) {
			return t('auth.signUp.errors.passwordMinLength');
		}

		const hasUpperCase = /[A-Z]/.test(passwordValue);
		const hasLowerCase = /[a-z]/.test(passwordValue);
		const hasNumbers = /\d/.test(passwordValue);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

		if (!hasUpperCase) {
			return t('auth.signUp.errors.passwordUppercase');
		}

		if (!hasLowerCase) {
			return t('auth.signUp.errors.passwordLowercase');
		}

		if (!hasNumbers) {
			return t('auth.signUp.errors.passwordNumber');
		}

		if (!hasSpecialChar) {
			return t('auth.signUp.errors.passwordSpecial');
		}

		return '';
	};

	const validatePasswordMatch = (passwordValue: string, confirmPasswordValue: string): string => {
		if (!confirmPasswordValue) {
			return t('auth.signUp.errors.confirmRequired');
		}

		if (passwordValue !== confirmPasswordValue) {
			return t('auth.signUp.errors.passwordMismatch');
		}

		return '';
	};

	// Real-time validation handlers
	const handleNameValidation = () => {
		const nameError = validateName($name);
		setFieldError('name', nameError);
	};

	const handleEmailValidation = () => {
		const emailError = validateEmail($email);
		setFieldError('email', emailError);
	};

	const handlePasswordValidation = () => {
		const passwordError = validatePassword($password);
		setFieldError('password', passwordError);

		// Also revalidate confirm password if it has a value
		if ($confirmPassword) {
			handleConfirmPasswordValidation();
		}
	};

	const handleConfirmPasswordValidation = () => {
		const confirmPasswordError = validatePasswordMatch($password, $confirmPassword);
		setFieldError('confirmPassword', confirmPasswordError);
	};

	// Validate all fields
	const validateAllFields = (): boolean => {
		const nameError = validateName($name);
		const emailError = validateEmail($email);
		const passwordError = validatePassword($password);
		const confirmPasswordError = validatePasswordMatch($password, $confirmPassword);

		errors.set({
			name: nameError,
			email: emailError,
			password: passwordError,
			confirmPassword: confirmPasswordError,
			general: ''
		});

		return !nameError && !emailError && !passwordError && !confirmPasswordError;
	};

	// Success state for showing verification message
	let registrationSuccess = $state(false);
	let registeredEmail = $state('');

	const handleSignUp = async () => {
		// Clear any previous general errors
		setFieldError('general', '');

		// Validate all fields before submission
		if (!validateAllFields()) {
			return;
		}

		$isLoading = true;

		try {
			await authClient.signUp.email(
				{
					name: $name,
					email: $email,
					password: $password,
					callbackURL: '/admin'
				},
				{
					async onSuccess() {
						// Registration successful - show verification message
						console.log('Registration successful, verification email sent');
						registrationSuccess = true;
						registeredEmail = $email;

						// Note: Welcome email will be sent after email verification is completed
						// This prevents sending both verification and welcome emails at the same time
						console.log('Welcome email will be sent after email verification');
					},
					onError(context) {
						// Handle registration errors with comprehensive error mapping
						const errorMessage = context.error.message || '';
						const errorCode = context.error.code || '';

						// Handle duplicate email registration errors
						if (
							errorMessage.toLowerCase().includes('email') &&
							(errorMessage.toLowerCase().includes('already') ||
								errorMessage.toLowerCase().includes('exists') ||
								errorMessage.toLowerCase().includes('duplicate') ||
								errorCode === 'EMAIL_ALREADY_EXISTS')
						) {
							setFieldError('general', t('auth.signUp.errors.emailExists'));
							return;
						}

						// Handle network errors with retry suggestions
						if (
							errorMessage.toLowerCase().includes('network') ||
							errorMessage.toLowerCase().includes('fetch') ||
							errorMessage.toLowerCase().includes('connection') ||
							errorCode === 'NETWORK_ERROR'
						) {
							setFieldError('general', t('auth.signUp.errors.network'));
							return;
						}

						// Handle server validation errors from Better Auth responses
						if (
							errorMessage.toLowerCase().includes('validation') ||
							errorMessage.toLowerCase().includes('invalid') ||
							errorCode === 'VALIDATION_ERROR'
						) {
							// Check if it's a specific field validation error
							if (errorMessage.toLowerCase().includes('name')) {
								setFieldError('name', t('auth.signUp.errors.nameRequired'));
							} else if (errorMessage.toLowerCase().includes('email')) {
								setFieldError('email', t('auth.signUp.errors.emailInvalid'));
							} else if (errorMessage.toLowerCase().includes('password')) {
								setFieldError('password', t('auth.signUp.errors.passwordRequired'));
							} else {
								setFieldError('general', t('auth.signUp.errors.generic'));
							}
							return;
						}

						// Handle server errors
						if (
							errorMessage.toLowerCase().includes('server') ||
							errorMessage.toLowerCase().includes('internal') ||
							errorCode === 'INTERNAL_SERVER_ERROR'
						) {
							setFieldError('general', t('auth.signUp.errors.generic'));
							return;
						}

						// Handle rate limiting
						if (
							errorMessage.toLowerCase().includes('rate') ||
							errorMessage.toLowerCase().includes('limit') ||
							errorCode === 'RATE_LIMITED'
						) {
							setFieldError('general', t('auth.signUp.errors.generic'));
							return;
						}

						// Fallback for any other specific error messages
						if (errorMessage) {
							setFieldError('general', errorMessage);
						} else {
							setFieldError('general', t('auth.signUp.errors.generic'));
						}
					}
				}
			);
		} catch (error) {
			// Fallback error handling for unexpected scenarios
			console.error('Unexpected registration error:', error);

			// Provide specific error messages based on error type
			if (error instanceof TypeError && error.message.includes('fetch')) {
				setFieldError('general', t('auth.signUp.errors.network'));
			} else if (error instanceof Error) {
				// Log the actual error for debugging but show user-friendly message
				console.error('Registration error details:', error.message);
				setFieldError('general', t('auth.signUp.errors.generic'));
			} else {
				setFieldError('general', t('auth.signUp.errors.generic'));
			}
		} finally {
			$isLoading = false;
		}
	};
</script>

<div class="mb-6 hidden">
	<h2 class="text-2xl font-semibold">
		{registrationSuccess ? t('auth.signIn.verification.title') : t('auth.signUp.title')}
	</h2>
	<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
		{registrationSuccess
			? t('auth.signUp.success.emailSent', { email: registeredEmail })
			: t('auth.signUp.description')}
	</p>
</div>
{#if registrationSuccess}
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
			<h3 class="text-lg font-medium">{t('auth.signUp.success.title')}</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{t('auth.signUp.success.emailSent', { email: registeredEmail })}
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
					<p class="mb-2 font-medium">{t('auth.signUp.success.nextSteps')}</p>
					<ol class="list-inside list-decimal space-y-1 text-xs">
						<li>{t('auth.signUp.success.step1')}</li>
						<li>{t('auth.signUp.success.step2')}</li>
						<li>{t('auth.signUp.success.step3')}</li>
					</ol>
					<p class="mt-2 text-xs font-medium">
						{t('auth.signUp.success.verificationRequired')}
					</p>
				</div>
			</div>
		</div>

		<div class="space-y-2">
			<Button class="w-full" onclick={() => (window.location.href = '/resend-verification')}>
				{t('auth.signUp.success.noEmail')}
			</Button>
			<Button
				variant="outline"
				class="w-full"
				onclick={() => (window.location.href = '/admin/sign-in?registered=true')}
			>
				{t('auth.signUp.success.backToSignIn')}
			</Button>
		</div>

		<p class="text-xs text-gray-500">{t('auth.signUp.success.checkSpam')}</p>
	</div>
{:else}
	<div class="grid gap-4">
		<!-- Email verification requirement notice -->
		<div class="rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950">
			<div class="flex items-start gap-2">
				<svg class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="text-amber-800 dark:text-amber-200">
					<p class="font-medium">{t('auth.signUp.verification.warning')}</p>
					<p class="mt-1 text-xs">
						{t('auth.signUp.verification.warningText')}
					</p>
				</div>
			</div>
		</div>
		{#if $errors.general}
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
					<span>{$errors.general}</span>
				</div>
			</div>
		{/if}

		<div class="grid gap-2">
			<Label for="name">{t('auth.signUp.name')}</Label>
			<Input
				id="name"
				type="text"
				placeholder={t('auth.signUp.namePlaceholder')}
				required
				bind:value={$name}
				onblur={handleNameValidation}
				oninput={() => {
					// Clear error on input to provide immediate feedback
					if ($errors.name) {
						setFieldError('name', '');
					}
				}}
				class={$errors.name
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: $name && !$errors.name
						? 'border-green-500'
						: ''}
			/>
			{#if $errors.name}
				<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
					<svg class="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zM9.25 15a.75.75 0 011.5 0v.01a.75.75 0 01-1.5 0V15z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{$errors.name}</span>
				</div>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="email">{t('auth.signUp.email')}</Label>
			<Input
				id="email"
				type="email"
				placeholder={t('auth.signUp.emailPlaceholder')}
				required
				bind:value={$email}
				onblur={handleEmailValidation}
				oninput={() => {
					// Clear error on input to provide immediate feedback
					if ($errors.email) {
						setFieldError('email', '');
					}
				}}
				class={$errors.email
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: $email && !$errors.email
						? 'border-green-500'
						: ''}
			/>
			{#if $errors.email}
				<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
					<svg class="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zM9.25 15a.75.75 0 011.5 0v.01a.75.75 0 01-1.5 0V15z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{$errors.email}</span>
				</div>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="password">{t('auth.signUp.password')}</Label>
			<Input
				id="password"
				type="password"
				required
				bind:value={$password}
				onblur={handlePasswordValidation}
				oninput={() => {
					// Clear error on input to provide immediate feedback
					if ($errors.password) {
						setFieldError('password', '');
					}
				}}
				class={$errors.password
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: $password && !$errors.password
						? 'border-green-500'
						: ''}
			/>
			{#if $errors.password}
				<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
					<svg class="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zM9.25 15a.75.75 0 011.5 0v.01a.75.75 0 01-1.5 0V15z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{$errors.password}</span>
				</div>
			{/if}
		</div>

		<div class="grid gap-2">
			<Label for="confirmPassword">{t('auth.signUp.confirmPassword')}</Label>
			<Input
				id="confirmPassword"
				type="password"
				required
				bind:value={$confirmPassword}
				onblur={handleConfirmPasswordValidation}
				oninput={() => {
					// Clear error on input to provide immediate feedback
					if ($errors.confirmPassword) {
						setFieldError('confirmPassword', '');
					}
				}}
				class={$errors.confirmPassword
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: $confirmPassword && !$errors.confirmPassword
						? 'border-green-500'
						: ''}
			/>
			{#if $errors.confirmPassword}
				<div class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
					<svg class="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zM9.25 15a.75.75 0 011.5 0v.01a.75.75 0 01-1.5 0V15z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{$errors.confirmPassword}</span>
				</div>
			{/if}
		</div>

		<Button
			type="button"
			class="w-full"
			onclick={handleSignUp}
			disabled={$isLoading || !$isFormValid}
		>
			{$isLoading ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
		</Button>

		<Button
			variant="outline"
			class="w-full"
			disabled={$isLoading}
			onclick={async () => {
				await authClient.signIn.social({
					provider: 'google',
					callbackURL: '/admin'
				});
			}}
		>
			{t('auth.signUp.googleSignUp')}
		</Button>
	</div>

	<div class="mt-4 text-center text-sm">
		{t('auth.signUp.hasAccount')}
		<a href="/admin/sign-in" class="underline">{t('auth.signUp.signIn')}</a>
	</div>
{/if}
