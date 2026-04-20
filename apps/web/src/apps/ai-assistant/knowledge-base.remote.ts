/**
 * Knowledge Base Admin Remote Actions
 *
 * Admin funkciók a Knowledge Base kezeléséhez.
 * Csak admin jogosultsággal rendelkező felhasználók használhatják.
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { KnowledgeBaseService } from '$lib/server/ai-assistant/knowledgeBaseService.js';
import type { KnowledgeBaseLocale, KnowledgeBaseStatus } from '$lib/server/ai-assistant/types.js';
import { join } from 'path';
import { dev } from '$app/environment';

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
 * Admin jogosultság ellenőrzése
 */
async function checkAdminPermission(): Promise<{ success: boolean; error?: string }> {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'Nem vagy bejelentkezve.' };
	}

	// TODO: Implement proper admin role checking
	// For now, we'll allow all authenticated users to access Knowledge Base admin functions
	// In a production environment, you should implement proper role-based access control

	// Example implementation would be:
	// const userWithRoles = await userRepository.findByIdWithGroupsAndRoles(parseInt(locals.user.id));
	// const hasAdminRole = userWithRoles?.roles.some(role =>
	//   role.name.en === 'admin' || role.name.hu === 'admin'
	// );
	// if (!hasAdminRole) {
	//   return { success: false, error: 'Nincs jogosultságod ehhez a művelethez.' };
	// }

	return { success: true };
}

// ============================================================================
// reindexKnowledgeBase — Knowledge Base újraindexelése (admin)
// ============================================================================

export const reindexKnowledgeBase = command(
	reindexKnowledgeBaseSchema,
	async (data): Promise<ReindexKnowledgeBaseResult> => {
		// Admin jogosultság ellenőrzése
		const permissionCheck = await checkAdminPermission();
		if (!permissionCheck.success) {
			return { success: false, error: permissionCheck.error };
		}

		try {
			const startTime = Date.now();

			// Knowledge Base szolgáltatás inicializálása
			const knowledgeBasePath = dev
				? join(process.cwd(), 'static/knowledge-base')
				: join(process.cwd(), 'static/knowledge-base');

			// Singleton resetelése, hogy az új útvonallal jöjjön létre
			KnowledgeBaseService.resetInstance();
			const kbService = KnowledgeBaseService.getInstance(knowledgeBasePath);

			// Újraindexelés végrehajtása
			if (data.locale) {
				// Egy adott nyelv újraindexelése
				await kbService.reindex(data.locale);
				const duration = Date.now() - startTime;

				return {
					success: true,
					message: `${data.locale} nyelv újraindexelése sikeresen befejezve.`,
					reindexedLocales: [data.locale],
					duration
				};
			} else {
				// Összes nyelv újraindexelése
				await kbService.reindex();
				const duration = Date.now() - startTime;

				return {
					success: true,
					message: 'Összes nyelv újraindexelése sikeresen befejezve.',
					reindexedLocales: ['hu', 'en'],
					duration
				};
			}
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
		console.log('[KnowledgeBase] getKnowledgeBaseStatus hívás kezdete');

		// Admin jogosultság ellenőrzése
		const permissionCheck = await checkAdminPermission();
		if (!permissionCheck.success) {
			console.log(
				'[KnowledgeBase] Admin jogosultság ellenőrzés sikertelen:',
				permissionCheck.error
			);
			return { success: false, error: permissionCheck.error };
		}

		console.log('[KnowledgeBase] Admin jogosultság OK');

		try {
			// Knowledge Base szolgáltatás inicializálása
			const knowledgeBasePath = dev
				? join(process.cwd(), 'static/knowledge-base')
				: join(process.cwd(), 'static/knowledge-base');

			console.log('[KnowledgeBase] Knowledge Base útvonal:', knowledgeBasePath);
			console.log('[KnowledgeBase] Dev mód:', dev);

			// Singleton resetelése, hogy az új útvonallal jöjjön létre
			KnowledgeBaseService.resetInstance();
			const kbService = KnowledgeBaseService.getInstance(knowledgeBasePath);

			// Inicializálás biztosítása
			console.log('[KnowledgeBase] Inicializálás indítása...');
			await kbService.initialize();
			console.log('[KnowledgeBase] Inicializálás befejezve');

			// Státusz lekérdezése
			const status = kbService.getStatus();
			console.log('[KnowledgeBase] Státusz:', status);

			return {
				success: true,
				status
			};
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
