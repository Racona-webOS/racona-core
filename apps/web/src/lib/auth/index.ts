import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { twoFactor, emailOTP } from 'better-auth/plugins';
import { getRequestEvent } from '$app/server';
import { baseAuthConfig, baseCustomSessionPlugin } from './config';
import { EmailManager } from '$lib/server/email/manager';
import { EmailTemplateType } from '$lib/server/email/types';
import { config } from '$lib/config';
import { LOCALE_COOKIE_NAME, DEFAULT_FALLBACK_LOCALE } from '$lib/i18n/preference';

/**
 * Helper function to get the user's locale from the request.
 * @returns The user's locale code (e.g., 'hu', 'en').
 */
function getUserLocale(): string {
	try {
		const event = getRequestEvent();
		// Try to get locale from locals (set by hooks.server.ts)
		if (event.locals?.locale) {
			return event.locals.locale;
		}
		// Fallback to cookie
		const cookieLocale = event.cookies.get(LOCALE_COOKIE_NAME);
		if (cookieLocale) {
			return cookieLocale;
		}
	} catch {
		// If getRequestEvent fails, use default
	}
	return DEFAULT_FALLBACK_LOCALE;
}

/**
 * SvelteKit-specifikus auth konfiguráció.
 * Ez tartalmazza a közös konfigurációt és a SvelteKit-specifikus pluginokat.
 */
export const auth = betterAuth({
	...baseAuthConfig,
	plugins: [
		emailOTP({
			expiresIn: (config.EMAIL_OTP_EXPIRES_IN ?? 10) * 60,
			async sendVerificationOTP({ email, otp }: { email: string; otp: string }) {
				const emailManager = new EmailManager();
				const locale = getUserLocale();

				// Email OTP küldése a template rendszeren keresztül
				const result = await emailManager.sendTemplatedEmail({
					to: email,
					template: EmailTemplateType.EMAIL_OTP_SIGN_IN,
					data: {
						email,
						otp,
						appName: config.APP_NAME,
						expirationTime: `${config.EMAIL_OTP_EXPIRES_IN} ${locale === 'hu' ? 'perc' : 'minutes'}`
					},
					locale
				});

				if (!result.success) {
					throw new Error(
						locale === 'hu' ? 'Email OTP küldése sikertelen' : 'Failed to send email OTP'
					);
				}
			},
			sendVerificationOnSignUp: false // Ne küldjön OTP-t regisztrációkor
		}),
		twoFactor({
			issuer: config.APP_NAME,
			twoFactorTable: 'two_factors',
			otpOptions: {
				async sendOTP({ user, otp }) {
					const emailManager = new EmailManager();
					const locale = getUserLocale();

					// 2FA OTP küldése a template rendszeren keresztül
					const result = await emailManager.sendTemplatedEmail({
						to: user.email,
						template: EmailTemplateType.TWO_FACTOR_OTP,
						data: {
							name: user.name || user.email,
							email: user.email,
							otp,
							appName: config.APP_NAME,
							expirationTime: `${config.EMAIL_OTP_EXPIRES_IN} ${locale === 'hu' ? 'perc' : 'minutes'}`
						},
						locale
					});

					if (!result.success) {
						throw new Error(
							locale === 'hu' ? 'OTP email küldése sikertelen' : 'Failed to send OTP email'
						);
					}
				}
			}
		}),
		sveltekitCookies(getRequestEvent),
		baseCustomSessionPlugin
	] // make sure baseCustomSessionPlugin is the last plugin in the array
});
