import { command, getRequestEvent } from '$app/server';
import { listAccessiblePluginHelp } from '$lib/server/plugins/help/pluginHelp';
import type { PluginHelpInfo } from './types';

/**
 * A felhasználó számára elérhető pluginek súgójának tartalomjegyzéke.
 * Hiba esetén üres lista: a Súgó ekkor is megjeleníti a beépített tartalmat.
 */
export const getPluginHelpIndex = command(async (): Promise<PluginHelpInfo[]> => {
	const { locals } = getRequestEvent();
	if (!locals.user?.id) return [];

	try {
		return await listAccessiblePluginHelp(parseInt(locals.user.id), locals.locale || 'hu');
	} catch (err) {
		console.warn('[Help] Plugin súgók lekérési hiba:', err);
		return [];
	}
});
