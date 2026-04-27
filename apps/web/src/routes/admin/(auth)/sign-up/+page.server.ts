import type { PageServerLoad } from './$types';
import { translationRepository, adminConfigRepository } from '$lib/server/database/repositories';
import { env } from '$lib/env';
import { redirect } from '@sveltejs/kit';
import type { AuthConfig } from '@racona/database/schemas';

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('i18n:locale');

	const locale = locals.locale || env.DEFAULT_LOCALE;

	// Auth konfiguráció ellenőrzése
	let registrationEnabled = true;

	try {
		const authConfig = await adminConfigRepository.getByConfigKey('auth');
		if (authConfig && authConfig.configData) {
			const config = authConfig.configData as AuthConfig;
			registrationEnabled = config.registrationEnabled;
		}
	} catch (error) {
		console.error('Error loading auth config from database:', error);
	}

	// Ha a regisztráció le van tiltva, átirányítjuk a bejelentkezési oldalra
	if (!registrationEnabled) {
		throw redirect(302, '/admin/sign-in');
	}

	// Fordítás lekérése az adatbázisból
	const titleTranslation = await translationRepository.getByKey(locale, 'auth', 'signUp.title');

	return {
		title: titleTranslation?.value || ''
	};
};
