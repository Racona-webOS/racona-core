/**
 * Remote Function Handler API Endpoint
 *
 * POST /api/plugins/:pluginId/remote/:functionName
 *
 * Task 9.7: Remote függvény hívás endpoint
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@elyos/database';
import db from '$lib/server/database';
import { client as pool } from '$lib/server/database';
import { apps } from '@elyos/database';
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

		// Átmeneti mock user
		const userId = 'user-123';

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
		const permissions = (plugin.pluginPermissions as string[]) || [];
		if (!permissions.includes('remote_functions')) {
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
			permissions
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
	permissions: string[]
): Promise<unknown> {
	try {
		// Plugin server könyvtár útvonala
		const pluginDir = path.join(process.cwd(), 'uploads', 'plugins', pluginId);
		const serverFunctionsPathJs = path.join(pluginDir, 'server', 'functions.js');
		const serverFunctionsPathTs = path.join(pluginDir, 'server', 'functions.ts');

		// .js preferált, fallback .ts (dev módban)
		const { existsSync } = await import('fs');
		const serverFunctionsPath = existsSync(serverFunctionsPathJs)
			? serverFunctionsPathJs
			: serverFunctionsPathTs;

		// Dinamikus import a server függvényekhez
		/* @vite-ignore */
		const serverModule = await import(serverFunctionsPath);

		// Függvény ellenőrzés
		if (!serverModule[functionName] || typeof serverModule[functionName] !== 'function') {
			throw new Error(
				`${PluginErrorCode.REMOTE_ERROR}: Function '${functionName}' not found in plugin`
			);
		}

		// Email service létrehozása (csak notifications jogosultsággal rendelkező pluginok számára)
		const emailService = createPluginEmailService(pluginId, permissions);

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
			permissions,
			...(emailService ? { email: emailService } : {})
		};

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
