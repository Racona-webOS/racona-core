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
 *   - notifications: csak 'notifications' joggal rendelkező pluginnak
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
import { toClientError } from '$lib/server/plugins/utils/remote-error';
import { getEmailManager } from '$lib/server/email/init';
import type { EmailResult } from '$lib/server/email/types';
import { sendNotification } from '$lib/server/socket';
import type { I18nContent } from '$lib/server/socket';

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
 * Plugin notification service interfész
 * Rendszeren belüli értesítés küldése a megadott felhasználóknak a core
 * notification rendszerén keresztül (adatbázis + valós idejű Socket.IO push).
 * Az értesítés appName mezője mindig a plugin ID-ja.
 */
export interface _PluginNotificationService {
	send(params: {
		userId?: number;
		userIds?: number[];
		title: string | I18nContent;
		message: string | I18nContent;
		type?: 'info' | 'success' | 'warning' | 'error' | 'critical';
		data?: Record<string, unknown>;
	}): Promise<{ success: boolean; error?: string }>;
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

		// Üzleti logika hiba (pl. "nincs szabadságkeret") — az üzenet a kliensé.
		// Váratlan hiba (adatbázis, programhiba) — csak általános üzenet megy ki,
		// a részletek a logba kerülnek, a hivatkozási azonosító köti össze a kettőt.
		const clientError = toClientError(err);

		console.error(
			`[RemoteFunctionHandler] ${pluginId}/${functionName} failed` +
				(clientError.reference ? ` (ref: ${clientError.reference})` : '') +
				':',
			err
		);

		return json({
			success: false,
			error: clientError.message,
			...(clientError.internal
				? { errorCode: PluginErrorCode.SERVER_ERROR, reference: clientError.reference }
				: {})
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

/** A pillanatkép-mappák előtagja a plugin könyvtárában (`.server-<mtime>`). */
const SERVER_SNAPSHOT_PREFIX = '.server-';

/** Folyamatban lévő vagy kész pillanatképek: mappa → a mappa, ha elkészült. */
const serverSnapshots = new Map<string, Promise<string>>();

/**
 * A plugin szerver moduljának importálható URL-je.
 *
 * A futtatókörnyezet (Node/Bun, dev módban a Vite SSR is) URL szerint
 * gyorsítótárazza a modulokat. Ha csak a belépő fájl kapna új URL-t, az általa
 * importált modulok (pl. `./leave-closing.js`) a régi betöltésből maradnának
 * meg, és frissítés után a régi és az új kód keveredne: egy új modul a régi
 * testvérét kapná, amiből hiányzik egy export. Ezért a `server/` mappát a
 * belépő fájl módosítási idejével jelölt testvérmappába másoljuk
 * (`<plugin>/.server-<mtime>/`), és onnan importálunk: minden modul új URL-t
 * kap. Testvérmappa, hogy a `../` és a csomag-importok ugyanoda oldódjanak fel.
 * Ha a belépő fájl nem változott, ugyanaz a mappa marad → cache találat.
 *
 * @param pluginDir - A plugin könyvtára.
 * @param entryPath - A belépő fájl (`server/functions.{js,ts}`) útvonala.
 * @returns A pillanatképben lévő belépő fájl `file://` URL-je.
 */
async function resolveServerModuleUrl(pluginDir: string, entryPath: string): Promise<string> {
	const { stat } = await import('fs/promises');
	let mtime = 0;
	try {
		mtime = Math.round((await stat(entryPath)).mtimeMs);
	} catch {
		/* fallback: pillanatkép nélkül, közvetlenül */
	}
	if (mtime === 0) return new URL(`file://${path.resolve(entryPath)}`).href;

	const snapshotDir = path.join(pluginDir, `${SERVER_SNAPSHOT_PREFIX}${mtime}`);
	let snapshot = serverSnapshots.get(snapshotDir);
	if (!snapshot) {
		snapshot = createServerSnapshot(pluginDir, path.dirname(entryPath), snapshotDir);
		serverSnapshots.set(snapshotDir, snapshot);
		// Hiba esetén a következő hívás újrapróbálja
		snapshot.catch(() => serverSnapshots.delete(snapshotDir));
	}
	const dir = await snapshot;
	return new URL(`file://${path.resolve(dir, path.basename(entryPath))}`).href;
}

/**
 * A `server/` mappa másolása a pillanatkép-mappába, majd a régi pillanatképek
 * törlése. Ideiglenes néven másol és átnevez, hogy egy párhuzamos kérés (vagy
 * másik folyamat) ne lásson félkész mappát.
 *
 * @param pluginDir - A plugin könyvtára.
 * @param serverDir - A másolandó `server/` mappa.
 * @param snapshotDir - A pillanatkép-mappa.
 * @returns A pillanatkép-mappa.
 */
async function createServerSnapshot(
	pluginDir: string,
	serverDir: string,
	snapshotDir: string
): Promise<string> {
	const { access, cp, readdir, rename, rm } = await import('fs/promises');
	const exists = (p: string) =>
		access(p).then(
			() => true,
			() => false
		);

	if (!(await exists(snapshotDir))) {
		const tmpDir = `${snapshotDir}.tmp-${process.pid}-${Date.now()}`;
		await cp(serverDir, tmpDir, { recursive: true });
		try {
			await rename(tmpDir, snapshotDir);
		} catch (err) {
			// Közben egy másik kérés elkészítette: azt használjuk
			await rm(tmpDir, { recursive: true, force: true });
			if (!(await exists(snapshotDir))) throw err;
		}
	}

	// A régi verziók pillanatképei már nem kellenek (a betöltött modulok a memóriában vannak)
	for (const entry of await readdir(pluginDir)) {
		const entryPath = path.join(pluginDir, entry);
		if (
			entry.startsWith(SERVER_SNAPSHOT_PREFIX) &&
			entryPath !== snapshotDir &&
			!entry.includes('.tmp-')
		) {
			await rm(entryPath, { recursive: true, force: true }).catch(() => {});
			serverSnapshots.delete(entryPath);
		}
	}
	return snapshotDir;
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

		const { existsSync } = await import('fs');
		const serverFunctionsPath = existsSync(serverFunctionsPathJs)
			? serverFunctionsPathJs
			: serverFunctionsPathTs;

		// Dinamikus import a server függvényekhez, a verzió pillanatképéből
		const fileUrl = await resolveServerModuleUrl(pluginDir, serverFunctionsPath);
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
		const notificationService = createPluginNotificationService(pluginId, pluginPermissions);

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
			...(emailService ? { email: emailService } : {}),
			...(notificationService ? { notifications: notificationService } : {})
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

/** Az értesítés típusok, amiket a notifications.type oszlop elfogad */
const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'critical'] as const;

/**
 * Plugin notification service létrehozása
 * Csak notifications jogosultsággal rendelkező pluginok számára elérhető.
 * Csak megnevezett felhasználóknak küldhet — broadcast és csoport nem engedélyezett.
 */
function createPluginNotificationService(
	pluginId: string,
	permissions: string[]
): _PluginNotificationService | undefined {
	if (!permissions.includes('notifications')) {
		return undefined;
	}

	return {
		async send({ userId, userIds, title, message, type = 'info', data }) {
			try {
				const targets = [...new Set([...(userIds ?? []), ...(userId !== undefined ? [userId] : [])])];

				if (targets.length === 0) {
					return { success: false, error: 'userId or userIds is required' };
				}
				if (!targets.every((id) => Number.isInteger(id) && id > 0)) {
					return { success: false, error: 'User IDs must be positive integers' };
				}
				if (!NOTIFICATION_TYPES.includes(type)) {
					return { success: false, error: `type must be one of: ${NOTIFICATION_TYPES.join(', ')}` };
				}

				await sendNotification({
					userIds: targets,
					appName: pluginId,
					title,
					message,
					type,
					data
				});

				return { success: true };
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown notification error';
				console.error(
					`[PluginNotificationService] Notification sending failed for ${pluginId}:`,
					errorMessage
				);
				return { success: false, error: errorMessage };
			}
		}
	};
}
