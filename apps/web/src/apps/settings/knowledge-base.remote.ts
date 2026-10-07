/**
 * Knowledge Base Admin Remote Actions
 *
 * Admin funkciók a Knowledge Base kezeléséhez.
 * Csak settings.admin.aiAssistant jogosultsággal használhatók.
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { permissionRepository } from '$lib/server/database/repositories';
import { getKnowledgeBase } from '$lib/server/ai-assistant/knowledgeBaseService.js';
import type { KnowledgeBaseLocale, KnowledgeBaseStatus } from '$lib/server/ai-assistant/types.js';

// ============================================================================
// Sémák
// ============================================================================

/** reindexKnowledgeBase: Knowledge Base újraindexelése */
const reindexKnowledgeBaseSchema = v.object({
	locale: v.optional(v.union([v.literal('hu'), v.literal('en')]))
});

// ============================================================================
// Válasz típusok
// ============================================================================

export interface ReindexKnowledgeBaseResult {
	success: boolean;
	error?: string;
	message?: string;
	reindexedLocales?: KnowledgeBaseLocale[];
	duration?: number;
}

export interface GetKnowledgeBaseStatusResult {
	success: boolean;
	error?: string;
	status?: KnowledgeBaseStatus;
}

// ============================================================================
// Helper funkciók
// ============================================================================

/**
 * Admin jogosultság ellenőrzése (ugyanaz a jog, mint az AI asszisztens beállításainál)
 */
async function checkAdminPermission(): Promise<{ success: boolean; error?: string }> {
	const { locals } = getRequestEvent();

	if (!locals.user?.id) {
		return { success: false, error: 'Nem vagy bejelentkezve.' };
	}

	try {
		const permissions = await permissionRepository.findPermissionsForUser(parseInt(locals.user.id));
		if (!permissions.includes('settings.admin.aiAssistant')) {
			return { success: false, error: 'Nincs jogosultságod ehhez a művelethez.' };
		}
		return { success: true };
	} catch (error) {
		console.error('[KnowledgeBase] Jogosultság ellenőrzési hiba:', error);
		return { success: false, error: 'Nincs jogosultságod ehhez a művelethez.' };
	}
}

// ============================================================================
// reindexKnowledgeBase — Knowledge Base újraindexelése (admin)
// ============================================================================

export const reindexKnowledgeBase = command(
	reindexKnowledgeBaseSchema,
	async (data): Promise<ReindexKnowledgeBaseResult> => {
		const permissionCheck = await checkAdminPermission();
		if (!permissionCheck.success) {
			return { success: false, error: permissionCheck.error };
		}

		try {
			const startTime = Date.now();
			await getKnowledgeBase().reindex(data.locale);
			const duration = Date.now() - startTime;

			return {
				success: true,
				message: data.locale
					? `${data.locale} nyelv újraindexelése sikeresen befejezve.`
					: 'Összes nyelv újraindexelése sikeresen befejezve.',
				reindexedLocales: data.locale ? [data.locale] : ['hu', 'en'],
				duration
			};
		} catch (err) {
			console.error('[KnowledgeBase] Újraindexelési hiba:', err);
			return {
				success: false,
				error:
					err instanceof Error ? err.message : 'Ismeretlen hiba történt az újraindexelés során.'
			};
		}
	}
);

// ============================================================================
// getKnowledgeBaseStatus — Knowledge Base státusz lekérdezése (admin)
// ============================================================================

export const getKnowledgeBaseStatus = command(
	v.object({}),
	async (): Promise<GetKnowledgeBaseStatusResult> => {
		const permissionCheck = await checkAdminPermission();
		if (!permissionCheck.success) {
			return { success: false, error: permissionCheck.error };
		}

		try {
			const kbService = getKnowledgeBase();
			await kbService.initialize();
			return { success: true, status: kbService.getStatus() };
		} catch (err) {
			console.error('[KnowledgeBase] Státusz lekérdezési hiba:', err);
			return {
				success: false,
				error:
					err instanceof Error
						? err.message
						: 'Ismeretlen hiba történt a státusz lekérdezése során.'
			};
		}
	}
);
