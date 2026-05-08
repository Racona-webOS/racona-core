/**
 * Remote Function Handler API Endpoint
 *
 * POST /api/plugins/:pluginId/remote/:functionName
 *
 * Task 9.7: Remote függvény hívás endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { client as pool } from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';
import path from 'path';
import { getEmailManager } from '$lib/server/email/init';
import type { EmailResult } from '$lib/server/email/types';

/**
 * Plugin email service interfész
 * Lehetővé teszi pluginok számára email küldést a core EmailManager rendszeren keresztül.
 * A template nevet automatikusan prefixeli az alkalmazás ID-val.
 */
export interface _PluginEmailService {
	send(params: {
		to: string | string[];
		template: string;
		data: Record<string, unknown>;
		locale?: string;
	}): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Remote függvény végrehajtása
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { pluginId, functionName } = params;

	try {
		// 1. Autentikáció ellenőrzés
		// TODO: Integrálni a meglévő auth rendszerrel
		// const user = locals.user;
		// if (!user) {
		// 	throw error(401, 'Unauthorized');
		// }

		// Átmeneti mock user - de lekérdezzük a valódi user jogosultságait
		console.log(
			'[RemoteFunctionHandler] DEBUG - locals.user:',
			JSON.stringify(locals.user, null, 2)
		);
		const userId = locals.user?.id || 'user-123';
		console.log('[RemoteFunctionHandler] DEBUG - userId:', userId, 'type:', typeof userId);

		// User jogosultságok lekérdezése az adatbázisból
		let userPermissions: string[] = [];
		if (locals.user?.id) {
			console.log(
				'[RemoteFunctionHandler] DEBUG - Querying user permissions for user ID:',
				locals.user.id
			);
			try {
				// Konvertáljuk number-re, ha string
				const userIdNum =
					typeof locals.user.id === 'string' ? parseInt(locals.user.id, 10) : locals.user.id;

				console.log(
					'[RemoteFunctionHandler] DEBUG - Converted userIdNum:',
					userIdNum,
					'type:',
					typeof userIdNum
				);

				// Ellenőrizzük, hogy van-e Rendszergazda (System Administrator) role-ja
				// Role ID 1 = Rendszergazda/System Administrator
				const roleResult = await pool.query(
					`SELECT r.id, r.name FROM auth.user_roles ur
					 JOIN auth.roles r ON ur.role_id = r.id
					 WHERE ur.user_id = $1 AND r.id = 1`,
					[userIdNum]
				);

				console.log(
					'[RemoteFunctionHandler] DEBUG - Role query result:',
					JSON.stringify(roleResult.rows, null, 2)
				);

				// Ha van Rendszergazda role (ID 1), akkor admin jogosultságot adunk
				if (roleResult.rows.length > 0) {
					userPermissions = ['admin'];
					console.log(
						'[RemoteFunctionHandler] DEBUG - User is admin (Rendszergazda), permissions set to:',
						userPermissions
					);
				} else {
					console.log('[RemoteFunctionHandler] DEBUG - User is NOT admin');
				}
			} catch (err) {
				console.error('[RemoteFunctionHandler] Error fetching user permissions:', err);
				console.error(
					'[RemoteFunctionHandler] Error stack:',
					err instanceof Error ? err.stack : 'No stack'
				);
			}
		} else {
			console.log(
				'[RemoteFunctionHandler] DEBUG - Skipping user permissions query. locals.user?.id:',
				locals.user?.id,
				'type:',
				typeof locals.user?.id
			);
		}

		console.log('[RemoteFunctionHandler] DEBUG - Final userPermissions:', userPermissions);

		// 2. Request body parsing
		const body = await request.json();
		const { params: functionParams } = body;

		// 3. Plugin ellenőrzés
		const pluginResult = await db
			.select({
				pluginStatus: apps.pluginStatus,
				appType: apps.appType,
				pluginPermissions: apps.pluginPermissions
			})
			.from(apps)
			.where(eq(apps.appId, pluginId))
			.limit(1);

		if (pluginResult.length === 0) {
			throw error(404, `${PluginErrorCode.PLUGIN_NOT_FOUND}: Plugin not found`);
		}

		const plugin = pluginResult[0];

		if (plugin.appType !== 'plugin') {
			throw error(400, 'Not a plugin application');
		}

		if (plugin.pluginStatus !== 'active') {
			throw error(403, `${PluginErrorCode.PLUGIN_INACTIVE}: Plugin is not active`);
		}

		// 4. Jogosultság ellenőrzés
		const pluginPermissions = (plugin.pluginPermissions as string[]) || [];
		if (!pluginPermissions.includes('remote_functions')) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Plugin does not have 'remote_functions' permission`
			);
		}

		// 5. Remote függvény betöltése és végrehajtása
		const result = await executeRemoteFunction(
			pluginId,
			functionName,
			functionParams,
			userId,
			pluginPermissions,
			userPermissions
		);

		// 6. Sikeres válasz
		return json({
			success: true,
			result
		});
	} catch (err) {
		console.error(`[RemoteFunctionHandler] Error executing ${functionName}:`, err);

		// SvelteKit error (404, 403 stb.) — ezeket továbbadjuk
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// Üzleti logika hiba (pl. "nincs szabadságkeret") — 200-as válasz, kliens kezeli
		return json({
			success: false,
			error: err instanceof Error ? err.message : 'Remote function execution failed'
		});
	}
};

/**
 * Remote függvény végrehajtása
 */
async function executeRemoteFunction(
	pluginId: string,
	functionName: string,
	params: unknown,
	userId: string,
	pluginPermissions: string[],
	userPermissions: string[]
): Promise<unknown> {
	try {
		// Plugin server könyvtár útvonala
		const pluginDir = path.join(process.cwd(), 'uploads', 'plugins', pluginId);

		// .js preferált, fallback .ts (Node.js 22.6+/23+/24+ natívan támogatja a .ts fájlokat)
		const serverFunctionsPathJs = path.join(pluginDir, 'server', 'functions.js');
		const serverFunctionsPathTs = path.join(pluginDir, 'server', 'functions.ts');

		const { existsSync, statSync } = await import('fs');
		const serverFunctionsPath = existsSync(serverFunctionsPathJs)
			? serverFunctionsPathJs
			: serverFunctionsPathTs;

		// Fájl mtime-je a URL query-be kerül, így plugin újratelepítéskor (a
		// `uploads/plugins/<id>/server/functions.ts` fájl módosult) a Node új
		// URL-ként importálja, és nem a cache-elt régi verziót használja.
		// Ha a fájl nem változott, ugyanaz az URL marad → cache találat.
		let mtime = 0;
		try {
			mtime = statSync(serverFunctionsPath).mtimeMs;
		} catch {
			/* fallback: cache-buster nélkül */
		}

		// file:// URL séma - működik Windows, macOS, Linux-on
		const base = new URL(`file://${path.resolve(serverFunctionsPath)}`).href;
		const fileUrl = mtime > 0 ? `${base}?v=${mtime}` : base;

		// Dinamikus import a server függvényekhez
		/* @vite-ignore */
		const serverModule = await import(fileUrl);

		// Függvény ellenőrzés
		if (!serverModule[functionName] || typeof serverModule[functionName] !== 'function') {
			throw new Error(
				`${PluginErrorCode.REMOTE_ERROR}: Function '${functionName}' not found in plugin`
			);
		}

		// Email service létrehozása (csak notifications jogosultsággal rendelkező pluginok számára)
		const emailService = createPluginEmailService(pluginId, pluginPermissions);

		// pg Pool-kompatibilis DB interfész a pluginok számára
		// A Drizzle ORM mögötti pg Pool-t használjuk, így a pluginok
		// natív .query(sql, params) hívásokat használhatnak
		// A pool.connect() is elérhető tranzakciókhoz (BEGIN/COMMIT/ROLLBACK)
		const pluginDb = {
			query: pool.query.bind(pool),
			connect: pool.connect.bind(pool)
		};

		// Execution context létrehozása
		const context = {
			pluginId,
			userId,
			db: pluginDb,
			permissions: userPermissions, // User jogosultságok (pl. 'admin')
			pluginPermissions, // Plugin jogosultságok (pl. 'remote_functions', 'notifications')
			...(emailService ? { email: emailService } : {})
		};

		console.log('[RemoteFunctionHandler] DEBUG - Context created:', {
			pluginId,
			userId,
			permissions: userPermissions,
			pluginPermissions,
			functionName
		});

		// Függvény végrehajtása timeout-tal (30 másodperc)
		const result = await Promise.race([
			serverModule[functionName](params, context),
			new Promise((_, reject) =>
				setTimeout(
					() => reject(new Error(`${PluginErrorCode.REMOTE_CALL_TIMEOUT}: Function timeout`)),
					30000
				)
			)
		]);

		console.log('[RemoteFunctionHandler] DEBUG - Function executed successfully:', functionName);

		return result;
	} catch (err) {
		console.error(`[RemoteFunctionHandler] Execution error:`, err);

		if (err instanceof Error && err.message.includes('Cannot find module')) {
			throw new Error(
				`${PluginErrorCode.REMOTE_ERROR}: Server functions file not found for plugin`
			);
		}

		throw err;
	}
}

/**
 * Email template név prefixelése az alkalmazás ID-val.
 * Tiszta (pure) függvény, amely a template nevet `${pluginId}:${templateName}` formátumban adja vissza.
 *
 * @param pluginId - Az alkalmazás azonosítója
 * @param templateName - A template neve (prefix nélkül)
 * @returns A prefixelt template név
 */
export function _prefixTemplateName(pluginId: string, templateName: string): string {
	return `${pluginId}:${templateName}`;
}

/**
 * Plugin email service létrehozása
 * Csak notifications jogosultsággal rendelkező pluginok számára elérhető.
 * A template nevet automatikusan prefixeli: 'employee_welcome' → 'ely-work:employee_welcome'
 */
function createPluginEmailService(
	pluginId: string,
	permissions: string[]
): _PluginEmailService | undefined {
	if (!permissions.includes('notifications')) {
		return undefined;
	}

	return {
		async send({ to, template, data, locale = 'hu' }): Promise<EmailResult> {
			try {
				const emailManager = getEmailManager();
				if (!emailManager) {
					return { success: false, error: 'Email service is not available' };
				}

				const prefixedTemplate = _prefixTemplateName(pluginId, template);

				return await emailManager.sendTemplatedEmail({
					to,
					template: prefixedTemplate as any,
					data,
					locale
				});
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown email error';
				console.error(`[PluginEmailService] Email sending failed for ${pluginId}:`, errorMessage);
				return { success: false, error: errorMessage };
			}
		}
	};
}
