import type { LayoutServerLoad } from './$types';
import { env } from '$lib/env';
import { translationRepository } from '$lib/server/database/repositories';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('i18n:locale');
	const rawLocales = env.SUPPORTED_LOCALES || 'hu,en';
	const supportedLocaleCodes =
		typeof rawLocales === 'string'
			? rawLocales
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: rawLocales;
	const locale = locals.locale || env.DEFAULT_LOCALE;

	const demoMode = env.DEMO_MODE ?? false;
	const demoNotice = demoMode
		? ((await translationRepository.getByKey(locale, 'auth', 'demo.notice'))?.value ?? '')
		: '';

	return {
		locale,
		supportedLocales: supportedLocaleCodes,
		appName: env.APP_NAME || '',
		demoMode,
		demoNotice
	};
};
