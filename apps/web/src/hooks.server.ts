import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { auth } from '$lib/auth/index';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { userRepository } from '$lib/server/database/repositories';
import { initializeEmailService } from '$lib/server/email';
import {
	resolveLocale,
	parseAcceptLanguage,
	LOCALE_COOKIE_NAME,
	DEFAULT_FALLBACK_LOCALE
} from '$lib/i18n/preference';
import { getI18nService, setDatabaseLoader } from '$lib/i18n';
import { translationRepository } from '$lib/server/database/repositories/translationRepository';
import { env } from '$lib/env';
import { logger } from '$lib/server/logging';
import { ensureDatabaseHealth } from '$lib/server/database/health';
import { initializeSocketIO } from '$lib/server/socket';
import { initServerMonitoring, captureServerException } from '$lib/monitoring/server';

// GlitchTip inicializálása szerver indításkor
// Kikapcsolható: PUBLIC_MONITORING_ENABLED=false
const monitoringEnabled = process.env.PUBLIC_MONITORING_ENABLED !== 'false';
if (monitoringEnabled && process.env.ERROR_TRACKING_DSN) {
	initServerMonitoring(process.env.ERROR_TRACKING_DSN, true, process.env.npm_package_version);
}

// Initialize services on server startup
let emailServiceInitialized = false;
let i18nServiceInitialized = false;
let socketIOInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	// CORS konfiguráció localhost origin-ekhez DEV_MODE esetén
	// Fejlesztői pluginok Vite dev szerverről való betöltéséhez szükséges
	if (env.DEV_MODE === true) {
		const origin = event.request.headers.get('origin');
		if (
			origin &&
			(origin.startsWith('http://localhost:') ||
				origin.startsWith('http://127.0.0.1:') ||
				origin.startsWith('http://host.docker.internal:'))
		) {
			// Preflight (OPTIONS) kérések kezelése
			if (event.request.method === 'OPTIONS') {
				return new Response(null, {
					status: 204,
					headers: {
						'Access-Control-Allow-Origin': origin,
						'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
						'Access-Control-Allow-Credentials': 'true',
						'Access-Control-Max-Age': '86400'
					}
				});
			}

			// CORS headerek hozzáadása a válaszhoz a resolve után
			const response = await handleRequest(event, resolve);
			response.headers.set('Access-Control-Allow-Origin', origin);
			response.headers.set('Access-Control-Allow-Credentials', 'true');
			return response;
		}
	}

	return handleRequest(event, resolve);
};

/**
 * Fő request kezelő logika — a CORS wrapper hívja.
 * @param {Parameters<Handle>[0]['event']} event - A SvelteKit szerver esemény.
 * @param {Parameters<Handle>[0]['resolve']} resolve - A SvelteKit resolve függvény.
 * @returns {Promise<Response>} A szerver válasza.
 */
async function handleRequest(
	event: Parameters<Handle>[0]['event'],
	resolve: Parameters<Handle>[0]['resolve']
): Promise<Response> {
	// Socket.IO inicializálása production módban (global.io a server.js-ből)
	if (!socketIOInitialized && !building) {
		const globalIo = (global as any).io;
		if (globalIo) {
			initializeSocketIO(globalIo);
		}
		socketIOInitialized = true;
	}

	// Initialize i18n service on server startup
	if (!i18nServiceInitialized && !building) {
		try {
			// Database loader beállítása
			setDatabaseLoader(async (locale: string, namespace: string) => {
				try {
					const translations = await translationRepository.getAsRecord(locale, namespace);
					return {
						success: true,
						translations,
						error: null
					};
				} catch (error) {
					console.error(`[I18n] Database loader error for ${locale}:${namespace}:`, error);
					return {
						success: false,
						translations: {},
						error: error instanceof Error ? error.message : 'Unknown error'
					};
				}
			});

			const i18nService = getI18nService();
			const defaultLocale = env.DEFAULT_LOCALE || 'hu';
			await i18nService.init({
				defaultLocale,
				fallbackLocale: defaultLocale
			});
		} catch (error) {
			console.error('[Server] I18n service initialization error:', error);
		}
		i18nServiceInitialized = true;
	}

	if (!emailServiceInitialized && !building) {
		try {
			// Enhanced initialization with migration and cache warm-up
			const emailState = await initializeEmailService({
				skipCacheWarmUp: false, // Warm up cache on startup
				validateConfiguration: true, // Validate configuration
				retryAttempts: 3,
				retryDelay: 1000
			});

			if (emailState.initialized) {
				if (emailState.degraded) {
					console.warn('[Server] Email service initialized in degraded mode');
				} else {
					//console.info('[Server] Email service initialized successfully');
				}
			} else {
				console.error('[Server] Email service failed to initialize:', {
					error: emailState.error,
					healthStatus: emailState.healthStatus
				});
			}
		} catch (error) {
			console.error('[Server] Email service initialization error:', error);
		}
		emailServiceInitialized = true;
	}

	// Locale meghatározása a prioritás lánc alapján
	const cookieLocale = event.cookies.get(LOCALE_COOKIE_NAME);
	const browserLocale = parseAcceptLanguage(event.request.headers.get('accept-language'));

	// Fetch current session from Better Auth for all routes
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Make session and user available on server for all routes
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	// Ha nincs publikus oldal engedélyezve, a nem-admin és nem-API route-ok átirányítanak /admin-ra
	const isPublicRoute =
		!event.url.pathname.startsWith('/admin') && !event.url.pathname.startsWith('/api/');

	if (!env.PUBLIC_SITE_ENABLED && isPublicRoute) {
		return redirect(307, '/admin');
	}

	// Protected API routes - require authentication
	const protectedApiPaths = ['/api/plugins/', '/api/apps/', '/api/email/', '/api/notifications/'];

	const isProtectedApi = protectedApiPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtectedApi && !session) {
		return new Response(JSON.stringify({ error: 'Unauthorized - Authentication required' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	if (event.route.id?.startsWith('/admin/(protected)')) {
		// Protected admin routes - require authentication
		if (!session) {
			return redirect(307, '/admin/sign-in');
		}

		// Check database health before proceeding
		try {
			await ensureDatabaseHealth();
		} catch (error) {
			console.error('[Server] Database health check failed:', error);
			throw new Error('Service temporarily unavailable', { cause: error });
		}

		// Betöltjük a beállításokat az adatbázisból
		const userId = parseInt(session.user.id);
		try {
			event.locals.settings = await userRepository.getUserSettings(userId);
		} catch (error) {
			console.error('[Server] Database error while loading user settings:', error);
			// Database unavailable - throw error that will be caught by handleError
			throw new Error('Service temporarily unavailable', { cause: error });
		}

		// Locale meghatározása: user settings > cookie > browser > fallback
		event.locals.locale = resolveLocale(
			event.locals.settings.locale,
			cookieLocale,
			browserLocale,
			DEFAULT_FALLBACK_LOCALE
		);

		// Cookie szinkronizálása — az SDK (plugin oldal) ebből olvassa a locale-t
		// Csak navigációs kéréseknél (nem API/fetch), hogy ne triggereljon layout reload-ot
		const isApiOrFetch =
			event.url.pathname.startsWith('/api/') ||
			event.request.headers.get('x-sveltekit-action') !== null ||
			event.request.headers.get('accept') === 'application/json';
		if (event.locals.locale !== cookieLocale && !isApiOrFetch) {
			event.cookies.set(LOCALE_COOKIE_NAME, event.locals.locale, {
				path: '/',
				maxAge: 60 * 60 * 24 * 365,
				httpOnly: false,
				secure: true,
				sameSite: 'lax'
			});
		}

		// Effektív téma mód kiszámítása (auto esetén a rendszer beállítás alapján)
		let effectiveMode = event.locals.settings.theme.mode;
		if (effectiveMode === 'auto') {
			// SSR esetén nem tudjuk a kliens rendszer beállítását, alapértelmezett: dark
			effectiveMode = 'dark';
		}
		return svelteKitHandler({
			event,
			resolve: (event) =>
				resolve(event, {
					transformPageChunk: ({ html }) => {
						// Téma osztály beillesztése a HTML-be
						return html.replace('#class-placeholder#', effectiveMode);
					}
				}),
			auth,
			building
		});
	} else {
		// Nem védett oldalak esetén is beállítjuk a locale-t
		event.locals.locale = resolveLocale(null, cookieLocale, browserLocale, DEFAULT_FALLBACK_LOCALE);

		// Cookie szinkronizálása nem védett oldalaknál is
		// Ha nincs cookie, de van böngésző nyelv vagy fallback, akkor beállítjuk
		const isApiOrFetch =
			event.url.pathname.startsWith('/api/') ||
			event.request.headers.get('x-sveltekit-action') !== null ||
			event.request.headers.get('accept') === 'application/json';
		if (event.locals.locale !== cookieLocale && !isApiOrFetch) {
			event.cookies.set(LOCALE_COOKIE_NAME, event.locals.locale, {
				path: '/',
				maxAge: 60 * 60 * 24 * 365,
				httpOnly: false,
				secure: true,
				sameSite: 'lax'
			});
		}

		return svelteKitHandler({
			event,
			resolve: (event) =>
				resolve(event, {
					transformPageChunk: ({ html }) => {
						// Auth oldalak mindig light módban jelennek meg
						return html.replace('#class-placeholder#', '');
					}
				}),
			auth,
			building
		});
	}
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : undefined;

	// Check if this is a database/service unavailability error
	const isDatabaseError =
		errorMessage.includes('Service temporarily unavailable') ||
		errorMessage.includes('database') ||
		errorMessage.includes('connection') ||
		errorMessage.includes('ECONNREFUSED');

	await logger.error(errorMessage, {
		source: 'server',
		stack,
		url: event.url.pathname,
		method: event.request.method,
		routeId: event.route.id ?? undefined,
		context: {
			status: isDatabaseError ? 503 : status,
			originalMessage: message,
			isDatabaseError
		}
	});

	// GlitchTip-re is elküldjük a hibát
	captureServerException(error, {
		url: event.url.pathname,
		method: event.request.method,
		status: isDatabaseError ? 503 : status
	});

	return {
		message: isDatabaseError ? 'Service temporarily unavailable' : 'Internal Error',
		status: isDatabaseError ? 503 : status
	};
};
