/**
 * Varlock séma validációs segédfüggvények
 *
 * Ez a fájl az .env.schema alapján definiálja a validációs szabályokat,
 * a kötelező és elvárt kulcsok listáját, valamint a fast-check arbitrary-t
 * a property-based tesztekhez.
 *
 * NE importálj az .env.schema fájlból runtime-ban — a szabályok itt vannak
 * TypeScript-ben kódolva.
 */

import * as fc from 'fast-check';

// =============================================================================
// Kulcs listák
// =============================================================================

/**
 * Az összes kötelező env változó neve.
 * Ezeknek jelen kell lenniük és érvényes értékkel kell rendelkezniük.
 */
export const REQUIRED_KEYS = [
	'NODE_ENV',
	'DATABASE_URL',
	'APP_URL',
	'ORIGIN',
	'BETTER_AUTH_SECRET',
	'BETTER_AUTH_URL'
] as const;

/**
 * Az összes env változó neve, amelyet a séma definiál.
 */
export const EXPECTED_ENV_KEYS = [
	// Bootstrap
	'INFISICAL_CLIENT_ID',
	'INFISICAL_CLIENT_SECRET',
	// Szerver
	'NODE_ENV',
	'BODY_SIZE_LIMIT',
	'RACONA_PORT',
	'APP_URL',
	'ORIGIN',
	// Adatbázis
	'DATABASE_URL',
	'POSTGRES_USER',
	'POSTGRES_PASSWORD',
	'POSTGRES_DB',
	'POSTGRES_PORT',
	// Alkalmazás megjelenés
	'APP_NAME',
	'APP_LOGO_URL',
	'EMAIL_USE_LOGO',
	'EMAIL_LOGO_MAX_WIDTH',
	// Hitelesítés
	'BETTER_AUTH_SECRET',
	'BETTER_AUTH_URL',
	'REGISTRATION_ENABLED',
	'SOCIAL_LOGIN_ENABLED',
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
	// Email
	'EMAIL_PROVIDER',
	'SMTP_HOST',
	'SMTP_PORT',
	'SMTP_SECURE',
	'SMTP_USERNAME',
	'SMTP_PASSWORD',
	'SMTP_FROM_EMAIL',
	'SMTP_FROM_NAME',
	'SMTP_REPLY_TO',
	'RESEND_API_KEY',
	'RESEND_FROM_EMAIL',
	'RESEND_VERIFIED_EMAIL',
	'RESEND_WEBHOOK_SECRET',
	'SENDGRID_API_KEY',
	'SENDGRID_FROM_EMAIL',
	'AWS_REGION',
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'EMAIL_TEST_MODE',
	'EMAIL_LOG_LEVEL',
	'EMAIL_OTP_EXPIRES_IN',
	// Email megerősítés
	'REQUIRE_EMAIL_VERIFICATION',
	'EMAIL_VERIFICATION_EXPIRES_IN',
	'AUTO_SIGNIN_AFTER_VERIFICATION',
	'VERIFICATION_FEATURE_ENABLED',
	'VERIFICATION_NEW_USERS_ONLY',
	'VERIFICATION_ROLLOUT_PERCENTAGE',
	// i18n
	'SUPPORTED_LOCALES',
	'DEFAULT_LOCALE',
	// Naplózás
	'LOG_TARGETS',
	'LOG_LEVEL',
	'LOG_DIR',
	// Fejlesztői / Demo mód
	'DEV_MODE',
	'DEMO_MODE',
	'DEMO_RESET_HOUR',
	// Publikus oldal
	'PUBLIC_SITE_ENABLED',
	// Plugin rendszer
	'PLUGIN_PACKAGE_EXTENSION',
	'PLUGIN_MAX_SIZE',
	'PLUGIN_STORAGE_DIR',
	'PLUGIN_TEMP_DIR'
] as const;

export type RequiredKey = (typeof REQUIRED_KEYS)[number];
export type ExpectedEnvKey = (typeof EXPECTED_ENV_KEYS)[number];

// =============================================================================
// Belső validációs segédfüggvények
// =============================================================================

/** Ellenőrzi, hogy az érték érvényes port szám-e (1–65535) */
function isValidPort(value: unknown): boolean {
	const n = Number(value);
	return Number.isInteger(n) && n >= 1 && n <= 65535;
}

/** Ellenőrzi, hogy az érték érvényes URL-e */
function isValidUrl(value: unknown): boolean {
	if (typeof value !== 'string' || value.trim() === '') return false;
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

/** Ellenőrzi, hogy az érték érvényes boolean string-e */
function isValidBoolean(value: unknown): boolean {
	return value === 'true' || value === 'false' || value === true || value === false;
}

/** Ellenőrzi, hogy az érték érvényes szám-e adott min/max határokkal */
function isValidNumber(value: unknown, min?: number, max?: number): boolean {
	const n = Number(value);
	if (isNaN(n)) return false;
	if (min !== undefined && n < min) return false;
	if (max !== undefined && n > max) return false;
	return true;
}

// =============================================================================
// validateSchema
// =============================================================================

/**
 * Validálja az env objektumot az .env.schema szabályai alapján.
 *
 * @param env - A validálandó env változók objektuma
 * @returns A validált env objektum (változatlan)
 * @throws Error ha bármely validációs szabály nem teljesül
 *
 * Validates: Requirements 3.4, 3.5, 3.6, 5.4, 5.5
 */
export function validateSchema(env: Record<string, unknown>): Record<string, unknown> {
	const errors: string[] = [];

	// --- Kötelező mezők ellenőrzése ---
	for (const key of REQUIRED_KEYS) {
		const value = env[key];
		if (value === undefined || value === null || value === '') {
			errors.push(`Hiányzó kötelező változó: ${key}`);
		}
	}

	// Ha kötelező mezők hiányoznak, azonnal dobjunk hibát
	if (errors.length > 0) {
		throw new Error(`[Varlock] Séma validáció sikertelen:\n${errors.join('\n')}`);
	}

	// --- NODE_ENV enum validáció ---
	const nodeEnv = env['NODE_ENV'];
	if (!['development', 'production', 'test'].includes(String(nodeEnv))) {
		errors.push(
			`Típusvalidáció sikertelen: NODE_ENV — elvárt: enum(development, production, test), kapott: "${nodeEnv}"`
		);
	}

	// --- DATABASE_URL prefix validáció ---
	const databaseUrl = env['DATABASE_URL'];
	if (typeof databaseUrl !== 'string' || !databaseUrl.startsWith('postgresql://')) {
		errors.push(
			`Típusvalidáció sikertelen: DATABASE_URL — az értéknek "postgresql://" prefixszel kell kezdődnie, kapott: "${databaseUrl}"`
		);
	}

	// --- URL típusú mezők validációja ---
	const urlFields = ['APP_URL', 'ORIGIN', 'BETTER_AUTH_URL'] as const;
	for (const key of urlFields) {
		const value = env[key];
		if (value !== undefined && value !== null && value !== '') {
			if (!isValidUrl(value)) {
				errors.push(`Típusvalidáció sikertelen: ${key} — elvárt: url, kapott: "${value}"`);
			}
		}
	}

	// --- Port típusú mezők validációja (opcionális) ---
	const portFields = ['RACONA_PORT', 'SMTP_PORT', 'POSTGRES_PORT'] as const;
	for (const key of portFields) {
		const value = env[key];
		if (value !== undefined && value !== null && value !== '') {
			if (!isValidPort(value)) {
				errors.push(
					`Típusvalidáció sikertelen: ${key} — elvárt: port (1–65535), kapott: "${value}"`
				);
			}
		}
	}

	// --- Boolean típusú mezők validációja (opcionális) ---
	const booleanFields = [
		'REGISTRATION_ENABLED',
		'SOCIAL_LOGIN_ENABLED',
		'SMTP_SECURE',
		'EMAIL_TEST_MODE',
		'REQUIRE_EMAIL_VERIFICATION',
		'AUTO_SIGNIN_AFTER_VERIFICATION',
		'VERIFICATION_FEATURE_ENABLED',
		'VERIFICATION_NEW_USERS_ONLY',
		'DEV_MODE',
		'DEMO_MODE',
		'PUBLIC_SITE_ENABLED',
		'EMAIL_USE_LOGO'
	] as const;
	for (const key of booleanFields) {
		const value = env[key];
		if (value !== undefined && value !== null && value !== '') {
			if (!isValidBoolean(value)) {
				errors.push(
					`Típusvalidáció sikertelen: ${key} — elvárt: boolean (true/false), kapott: "${value}"`
				);
			}
		}
	}

	// --- EMAIL_PROVIDER enum validáció (opcionális) ---
	const emailProvider = env['EMAIL_PROVIDER'];
	if (emailProvider !== undefined && emailProvider !== null && emailProvider !== '') {
		if (!['smtp', 'resend', 'sendgrid', 'ses'].includes(String(emailProvider))) {
			errors.push(
				`Típusvalidáció sikertelen: EMAIL_PROVIDER — elvárt: enum(smtp, resend, sendgrid, ses), kapott: "${emailProvider}"`
			);
		}
	}

	// --- EMAIL_LOG_LEVEL enum validáció (opcionális) ---
	const emailLogLevel = env['EMAIL_LOG_LEVEL'];
	if (emailLogLevel !== undefined && emailLogLevel !== null && emailLogLevel !== '') {
		if (!['debug', 'info', 'warn', 'error'].includes(String(emailLogLevel))) {
			errors.push(
				`Típusvalidáció sikertelen: EMAIL_LOG_LEVEL — elvárt: enum(debug, info, warn, error), kapott: "${emailLogLevel}"`
			);
		}
	}

	// --- LOG_LEVEL enum validáció (opcionális) ---
	const logLevel = env['LOG_LEVEL'];
	if (logLevel !== undefined && logLevel !== null && logLevel !== '') {
		if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(String(logLevel))) {
			errors.push(
				`Típusvalidáció sikertelen: LOG_LEVEL — elvárt: enum(debug, info, warn, error, fatal), kapott: "${logLevel}"`
			);
		}
	}

	// --- Numerikus mezők tartomány-validációja (opcionális) ---
	const numericRangeFields: Array<{ key: string; min?: number; max?: number }> = [
		{ key: 'EMAIL_OTP_EXPIRES_IN', min: 1, max: 20 },
		{ key: 'EMAIL_VERIFICATION_EXPIRES_IN', min: 1, max: 604800 },
		{ key: 'VERIFICATION_ROLLOUT_PERCENTAGE', min: 0, max: 100 },
		{ key: 'PLUGIN_MAX_SIZE', min: 1, max: 104857600 },
		{ key: 'DEMO_RESET_HOUR', min: 0, max: 23 },
		{ key: 'BODY_SIZE_LIMIT', min: 1 },
		{ key: 'EMAIL_LOGO_MAX_WIDTH', min: 1, max: 1000 }
	];
	for (const { key, min, max } of numericRangeFields) {
		const value = env[key];
		if (value !== undefined && value !== null && value !== '') {
			if (!isValidNumber(value, min, max)) {
				const range = [
					min !== undefined ? `min=${min}` : null,
					max !== undefined ? `max=${max}` : null
				]
					.filter(Boolean)
					.join(', ');
				errors.push(
					`Típusvalidáció sikertelen: ${key} — elvárt: number(${range}), kapott: "${value}"`
				);
			}
		}
	}

	if (errors.length > 0) {
		throw new Error(`[Varlock] Séma validáció sikertelen:\n${errors.join('\n')}`);
	}

	return env;
}

// =============================================================================
// validEnvArbitrary — fast-check arbitrary érvényes env objektumhoz
// =============================================================================

/**
 * fast-check arbitrary, amely érvényes env objektumokat generál a tesztekhez.
 * A generált objektumok minden esetben átmennek a validateSchema validáción.
 *
 * Validates: Requirements 5.4, 5.5
 */
export function validEnvArbitrary(): fc.Arbitrary<Record<string, unknown>> {
	// Érvényes postgresql:// URL generátor
	const postgresUrlArb = fc
		.tuple(
			fc.stringMatching(/^[a-z][a-z0-9_]{0,15}$/), // user
			fc.stringMatching(/^[a-zA-Z0-9_]{1,16}$/), // password
			fc.stringMatching(/^[a-z][a-z0-9_]{0,15}$/), // dbname
			fc.integer({ min: 1, max: 65535 }) // port
		)
		.map(([user, pass, db, port]) => `postgresql://${user}:${pass}@localhost:${port}/${db}`);

	// Érvényes HTTP/HTTPS URL generátor
	const httpUrlArb = fc
		.tuple(
			fc.constantFrom('http', 'https'),
			fc.stringMatching(/^[a-z][a-z0-9-]{0,20}\.[a-z]{2,6}$/)
		)
		.map(([scheme, host]) => `${scheme}://${host}`);

	// Érvényes port string generátor
	const portStringArb = fc.integer({ min: 1, max: 65535 }).map(String);

	// Érvényes boolean string generátor
	const boolStringArb = fc.constantFrom('true', 'false');

	return fc
		.record({
			// Kötelező mezők
			INFISICAL_CLIENT_ID: fc.string({ minLength: 1, maxLength: 64 }),
			INFISICAL_CLIENT_SECRET: fc.string({ minLength: 1, maxLength: 64 }),
			NODE_ENV: fc.constantFrom('development', 'production', 'test'),
			DATABASE_URL: postgresUrlArb,
			APP_URL: httpUrlArb,
			ORIGIN: httpUrlArb,
			BETTER_AUTH_SECRET: fc.string({ minLength: 1, maxLength: 64 }),
			BETTER_AUTH_URL: httpUrlArb,

			// Opcionális mezők
			BODY_SIZE_LIMIT: fc.option(fc.integer({ min: 1, max: 104857600 }).map(String), {
				nil: undefined
			}),
			RACONA_PORT: fc.option(portStringArb, { nil: undefined }),
			POSTGRES_USER: fc.option(fc.string({ minLength: 1, maxLength: 32 }), { nil: undefined }),
			POSTGRES_PASSWORD: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			POSTGRES_DB: fc.option(fc.string({ minLength: 1, maxLength: 32 }), { nil: undefined }),
			POSTGRES_PORT: fc.option(portStringArb, { nil: undefined }),
			APP_NAME: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			APP_LOGO_URL: fc.option(fc.string({ minLength: 1, maxLength: 128 }), { nil: undefined }),
			EMAIL_USE_LOGO: fc.option(boolStringArb, { nil: undefined }),
			EMAIL_LOGO_MAX_WIDTH: fc.option(fc.integer({ min: 1, max: 1000 }).map(String), {
				nil: undefined
			}),
			REGISTRATION_ENABLED: fc.option(boolStringArb, { nil: undefined }),
			SOCIAL_LOGIN_ENABLED: fc.option(boolStringArb, { nil: undefined }),
			GOOGLE_CLIENT_ID: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			GOOGLE_CLIENT_SECRET: fc.option(fc.string({ minLength: 1, maxLength: 64 }), {
				nil: undefined
			}),
			EMAIL_PROVIDER: fc.option(fc.constantFrom('smtp', 'resend', 'sendgrid', 'ses'), {
				nil: undefined
			}),
			SMTP_HOST: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SMTP_PORT: fc.option(portStringArb, { nil: undefined }),
			SMTP_SECURE: fc.option(boolStringArb, { nil: undefined }),
			SMTP_USERNAME: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SMTP_PASSWORD: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SMTP_FROM_EMAIL: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SMTP_FROM_NAME: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SMTP_REPLY_TO: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			RESEND_API_KEY: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			RESEND_FROM_EMAIL: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			RESEND_VERIFIED_EMAIL: fc.option(fc.string({ minLength: 1, maxLength: 64 }), {
				nil: undefined
			}),
			RESEND_WEBHOOK_SECRET: fc.option(fc.string({ minLength: 1, maxLength: 64 }), {
				nil: undefined
			}),
			SENDGRID_API_KEY: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			SENDGRID_FROM_EMAIL: fc.option(fc.string({ minLength: 1, maxLength: 64 }), {
				nil: undefined
			}),
			AWS_REGION: fc.option(fc.string({ minLength: 1, maxLength: 32 }), { nil: undefined }),
			AWS_ACCESS_KEY_ID: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			AWS_SECRET_ACCESS_KEY: fc.option(fc.string({ minLength: 1, maxLength: 64 }), {
				nil: undefined
			}),
			EMAIL_TEST_MODE: fc.option(boolStringArb, { nil: undefined }),
			EMAIL_LOG_LEVEL: fc.option(fc.constantFrom('debug', 'info', 'warn', 'error'), {
				nil: undefined
			}),
			EMAIL_OTP_EXPIRES_IN: fc.option(fc.integer({ min: 1, max: 20 }).map(String), {
				nil: undefined
			}),
			REQUIRE_EMAIL_VERIFICATION: fc.option(boolStringArb, { nil: undefined }),
			EMAIL_VERIFICATION_EXPIRES_IN: fc.option(fc.integer({ min: 1, max: 604800 }).map(String), {
				nil: undefined
			}),
			AUTO_SIGNIN_AFTER_VERIFICATION: fc.option(boolStringArb, { nil: undefined }),
			VERIFICATION_FEATURE_ENABLED: fc.option(boolStringArb, { nil: undefined }),
			VERIFICATION_NEW_USERS_ONLY: fc.option(boolStringArb, { nil: undefined }),
			VERIFICATION_ROLLOUT_PERCENTAGE: fc.option(fc.integer({ min: 0, max: 100 }).map(String), {
				nil: undefined
			}),
			SUPPORTED_LOCALES: fc.option(fc.string({ minLength: 1, maxLength: 32 }), { nil: undefined }),
			DEFAULT_LOCALE: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
			LOG_TARGETS: fc.option(fc.string({ minLength: 1, maxLength: 64 }), { nil: undefined }),
			LOG_LEVEL: fc.option(fc.constantFrom('debug', 'info', 'warn', 'error', 'fatal'), {
				nil: undefined
			}),
			LOG_DIR: fc.option(fc.string({ minLength: 1, maxLength: 128 }), { nil: undefined }),
			DEV_MODE: fc.option(boolStringArb, { nil: undefined }),
			DEMO_MODE: fc.option(boolStringArb, { nil: undefined }),
			DEMO_RESET_HOUR: fc.option(fc.integer({ min: 0, max: 23 }).map(String), { nil: undefined }),
			PUBLIC_SITE_ENABLED: fc.option(boolStringArb, { nil: undefined }),
			PLUGIN_PACKAGE_EXTENSION: fc.option(fc.string({ minLength: 1, maxLength: 32 }), {
				nil: undefined
			}),
			PLUGIN_MAX_SIZE: fc.option(fc.integer({ min: 1, max: 104857600 }).map(String), {
				nil: undefined
			}),
			PLUGIN_STORAGE_DIR: fc.option(fc.string({ minLength: 1, maxLength: 128 }), {
				nil: undefined
			}),
			PLUGIN_TEMP_DIR: fc.option(fc.string({ minLength: 1, maxLength: 128 }), { nil: undefined })
		})
		.map((record) => {
			// Távolítsuk el az undefined értékeket, hogy tiszta objektumot kapjunk
			return Object.fromEntries(
				Object.entries(record).filter(([, v]) => v !== undefined)
			) as Record<string, unknown>;
		});
}
