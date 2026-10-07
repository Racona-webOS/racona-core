/**
 * Plugin végpontok: elérheti-e a hívó felhasználó az appot.
 *
 * Az adatot adó és műveletet végző végpontok (remote, data, notifications) csak annak
 * szolgálnak ki, aki az appot az alkalmazáslistában is látja: nyilvános app, vagy
 * szerepkörén/csoportján keresztül hozzá van rendelve. A statikus erőforrások
 * (bundle, komponensek, menü, fordítás, assetek) ezen kívül esnek, mert adatot nem
 * adnak ki, és a core admin nézetei is használják őket.
 */

import { error } from '@sveltejs/kit';
import { PluginErrorCode } from '@racona/database';
import { appRepository } from '$lib/server/database/repositories';

/**
 * 403-at dob, ha a felhasználó nem érheti el a plugint (401-et, ha nincs érvényes felhasználó).
 *
 * @param userId - A bejelentkezett felhasználó azonosítója (`locals.user.id`)
 * @param pluginId - A plugin azonosítója
 */
export async function requirePluginAppAccess(
	userId: string | number | undefined,
	pluginId: string
): Promise<void> {
	const id = Number(userId);
	if (!Number.isInteger(id) || id <= 0) {
		throw error(401, 'Unauthorized');
	}

	if (!(await appRepository.canUserAccessApp(id, pluginId))) {
		throw error(403, `${PluginErrorCode.PERMISSION_DENIED}: No access to this app`);
	}
}
