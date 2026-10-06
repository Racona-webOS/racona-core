/**
 * A plugin szerver kódjának átadott szolgáltatások — közösen a remote
 * végpontnak (`/api/plugins/:pluginId/remote/:functionName`) és az
 * ütemezőnek ($lib/server/scheduler).
 */

import { client as pool } from '$lib/server/database';
import { getEmailManager } from '$lib/server/email/init';
import type { EmailResult, EmailTemplateType } from '$lib/server/email/types';
import { sendNotification } from '$lib/server/socket';
import type { I18nContent } from '$lib/server/socket';

export type { PluginFileService, PluginFileInfo } from '$lib/server/plugins/files';

/**
 * Plugin email service interfész
 * Lehetővé teszi pluginok számára email küldést a core EmailManager rendszeren keresztül.
 * A template nevet automatikusan prefixeli az alkalmazás ID-val.
 */
export interface PluginEmailService {
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
export interface PluginNotificationService {
	send(params: {
		userId?: number;
		userIds?: number[];
		title: string | I18nContent;
		message: string | I18nContent;
		type?: 'info' | 'success' | 'warning' | 'error' | 'critical';
		data?: Record<string, unknown>;
	}): Promise<{ success: boolean; error?: string }>;
}

/** pg Pool-kompatibilis DB interfész a pluginok számára. */
export interface PluginDb {
	query: typeof pool.query;
	connect: typeof pool.connect;
}

/**
 * A Drizzle ORM mögötti pg Pool, így a pluginok natív .query(sql, params)
 * hívásokat használhatnak; a pool.connect() tranzakciókhoz (BEGIN/COMMIT/ROLLBACK).
 * Nincs sémára korlátozva.
 */
export function createPluginDb(): PluginDb {
	return {
		query: pool.query.bind(pool),
		connect: pool.connect.bind(pool)
	};
}

/**
 * Email template név prefixelése az alkalmazás ID-val.
 * Tiszta (pure) függvény, amely a template nevet `${pluginId}:${templateName}` formátumban adja vissza.
 *
 * @param pluginId - Az alkalmazás azonosítója
 * @param templateName - A template neve (prefix nélkül)
 * @returns A prefixelt template név
 */
export function prefixTemplateName(pluginId: string, templateName: string): string {
	return `${pluginId}:${templateName}`;
}

/**
 * Plugin email service létrehozása
 * Csak notifications jogosultsággal rendelkező pluginok számára elérhető.
 * A template nevet automatikusan prefixeli: 'employee_welcome' → 'racona-work:employee_welcome'
 */
export function createPluginEmailService(
	pluginId: string,
	permissions: string[]
): PluginEmailService | undefined {
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

				const prefixedTemplate = prefixTemplateName(pluginId, template);

				return await emailManager.sendTemplatedEmail({
					to,
					// A plugin sablonok típusa `<pluginId>:<név>`, nem a core enum értéke
					template: prefixedTemplate as EmailTemplateType,
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
export function createPluginNotificationService(
	pluginId: string,
	permissions: string[]
): PluginNotificationService | undefined {
	if (!permissions.includes('notifications')) {
		return undefined;
	}

	return {
		async send({ userId, userIds, title, message, type = 'info', data }) {
			try {
				const targets = [
					...new Set([...(userIds ?? []), ...(userId !== undefined ? [userId] : [])])
				];

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
