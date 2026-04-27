import { env } from '$lib/env';
import type { PageServerLoad } from './$types';
import { translationRepository, adminConfigRepository } from '$lib/server/database/repositories';
import type { AuthConfig } from '@racona/database/schemas';

export const load: PageServerLoad = async ({ url, locals, depends }) => {
	depends('i18n:locale');

	const locale = locals.locale || env.DEFAULT_LOCALE;

	// Fordítás lekérése az adatbázisból
	const titleTranslation = await translationRepository.getByKey(locale, 'auth', 'signIn.title');

	// Auth konfiguráció lekérése az adatbázisból
	let registrationEnabled = true;
	let socialLoginEnabled = true;

	try {
		const authConfig = await adminConfigRepository.getByConfigKey('auth');
		if (authConfig && authConfig.configData) {
			const config = authConfig.configData as AuthConfig;
			registrationEnabled = config.registrationEnabled;
			socialLoginEnabled = config.socialLoginEnabled;
		}
	} catch (error) {
		console.error('Error loading auth config from database:', error);
	}

	return {
		title: titleTranslation?.value || '',
		registrationEnabled,
		socialLoginEnabled,
		registered: url.searchParams.has('registered'),
		demoMode: env.DEMO_MODE ?? false
	};
};
