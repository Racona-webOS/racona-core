/**
 * Remote Function Handler API Endpoint
 *
 * POST /api/plugins/:pluginId/remote/:functionName
 *
 * A plugin `server/functions.{js,ts}` moduljának egy exportált függvényét
 * futtatja a szerveren, `(params, context)` szignatúrával.
 *
 * A context tartalma:
 *   - pluginId, userId
 *   - db: pg Pool (query / connect) — nincs sémára korlátozva
 *   - permissions: a hívó user core jogosultságai (pl. 'plugin.manual.install'),
 *     rendszergazda esetén kiegészítve az 'admin' jelzővel
 *   - pluginPermissions: a plugin manifest jogosultságai
 *   - email: csak 'notifications' joggal rendelkező pluginnak
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { client as pool } from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';
import path from 'path';
import { getPluginDir } from '$lib/server/plugins/utils/filesystem';
import { getEmailManager } from '$lib/server/email/init';
import type { EmailResult } from '$lib/server/email/types';

/**
 * A rendszergazda szerep azonosítója.
 * A seed (packages/database/src/seeds/sql/auth/roles.sql) fix id-val hozza létre
 * a "Rendszergazda / System Administrator" szerepet, ezért az id stabil.
 */
const SYSTEM_ADMIN_ROLE_ID = 1;

/** A context.permissions-ben a rendszergazdát jelző érték (a pluginok erre építenek). */
const ADMIN_PERMISSION = 'admin';

/** Remote függvény futási időkorlátja (ms) */
const REMOTE_FUNCTION_TIMEOUT_MS = 30_000;

/** Érvényes JS azonosító — a modul exportjai közül csak ilyet hívunk */
const FUNCTION_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

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
		// 1. Autentikáció (a hooks is védi az /api/plugins/ útvonalakat, itt explicit)
		if (!locals.user?.id) {
			throw error(401, 'Unauthorized');
		}
		const userId = String(locals.user.id);

		if (!FUNCTION_NAME_PATTERN.test(functionName)) {
			throw error(400, 'Invalid function name');
		}

		// 2. A hívó core jogosultságai
		const userPermissions = await resolveCallerPermissions(userId);

		// 3. Request body parsing
		const body = await request.json().catch(() => ({}));
		const functionParams = (body as { params?: unknown })?.params;

		// 4. Plugin ellenőrzés
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

		// 5. Plugin jogosultság ellenőrzés
		const pluginPermissions = (plugin.pluginPermissions as string[]) || [];
		if (!pluginPermissions.includes('remote_functions')) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Plugin does not have 'remote_functions' permission`
			);
		}

		// 6. Remote függvény betöltése és végrehajtása
		const result = await executeRemoteFunction(
			pluginId,
			functionName,
			functionParams,
			userId,
			pluginPermissions,
			userPermissions
		);

		return json({ success: true, result });
	} catch (err) {
		// SvelteKit error (401, 403, 404 stb.) — ezeket továbbadjuk
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error(`[RemoteFunctionHandler] ${pluginId}/${functionName} failed:`, err);

		// Üzleti logika hiba (pl. "nincs szabadságkeret") — 200-as válasz, kliens kezeli
		return json({
			success: false,
			error: err instanceof Error ? err.message : 'Remote function execution failed'
		});
	}
};

/**
 * A hívó user core jogosultságai a plugin context számára.
 *
 * Role-ok és group-ok alapján összegyűjtött permission nevek, kiegészítve az
 * 'admin' jelzővel, ha a user rendszergazda szerepben van. Hiba esetén üres
 * lista — a plugin ilyenkor a legszűkebb jogokkal fut.
 */
async function resolveCallerPermissions(userId: string): Promise<string[]> {
	const userIdNum = Number.parseInt(userId, 10);
	if (!Number.isInteger(userIdNum)) {
		return [];
	}

	try {
		const [adminResult, permissionResult] = await Promise.all([
			pool.query(
				`SELECT 1 FROM auth.user_roles WHERE user_id = $1 AND role_id = $2 LIMIT 1`,
				[userIdNum, SYSTEM_ADMIN_ROLE_ID]
			),
			pool.query(
				`SELECT DISTINCT p.name
				   FROM auth.permissions p
				  WHERE p.id IN (
				        SELECT rp.permission_id
				          FROM auth.role_permissions rp
				          JOIN auth.user_roles ur ON ur.role_id = rp.role_id
				         WHERE ur.user_id = $1
				        UNION
				        SELECT gp.permission_id
				          FROM auth.group_permissions gp
				          JOIN auth.user_groups ug ON ug.group_id = gp.group_id
				         WHERE ug.user_id = $1
				  )`,
				[userIdNum]
			)
		]);

		const permissions = (permissionResult.rows as Array<{ name: string }>).map((r) => r.name);
		if (adminResult.rows.length > 0) {
			permissions.unshift(ADMIN_PERMISSION);
		}
		return permissions;
	} catch (err) {
		console.error('[RemoteFunctionHandler] Failed to resolve caller permissions:', err);
		return [];
	}
}

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
		const pluginDir = getPluginDir(pluginId);

		// .js preferált, fallback .ts (Bun és Node.js 22.6+ natívan támogatja a .ts fájlokat)
		const serverFunctionsPathJs = path.join(pluginDir, 'server', 'functions.js');
		const serverFunctionsPathTs = path.join(pluginDir, 'server', 'functions.ts');

		const { existsSync, statSync } = await import('fs');
		const serverFunctionsPath = existsSync(serverFunctionsPathJs)
			? serverFunctionsPathJs
			: serverFunctionsPathTs;

		// Fájl mtime-je a URL query-be kerül, így plugin újratelepítéskor (a
		// `uploads/plugins/<id>/server/functions.ts` fájl módosult) a runtime új
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

		// Csak a modul saját exportjai hívhatók (prototípus-lánc, pl. constructor, nem)
		const fn = Object.prototype.hasOwnProperty.call(serverModule, functionName)
			? serverModule[functionName]
			: undefined;
		if (typeof fn !== 'function') {
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
			permissions: userPermissions,
			pluginPermissions,
			...(emailService ? { email: emailService } : {})
		};

		// Függvény végrehajtása időkorláttal. Az időtúllépés a választ utasítja el,
		// a már futó függvényt nem szakítja meg.
		let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
		try {
			return await Promise.race([
				fn(params, context),
				new Promise((_, reject) => {
					timeoutHandle = setTimeout(
						() =>
							reject(new Error(`${PluginErrorCode.REMOTE_CALL_TIMEOUT}: Function timeout`)),
						REMOTE_FUNCTION_TIMEOUT_MS
					);
				})
			]);
		} finally {
			if (timeoutHandle) clearTimeout(timeoutHandle);
		}
	} catch (err) {
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
 * A template nevet automatikusan prefixeli: 'employee_welcome' → 'racona-work:employee_welcome'
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
