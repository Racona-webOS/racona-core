/**
 * Plugin job handler betöltése a `server/jobs.{js,ts}` modulból.
 *
 * A remote végpont csak a `server/functions` modult tölti be, így az itt lévő,
 * rendszerjogon futó függvényeket felhasználó nem hívhatja. A betöltés a remote
 * végponttal azonos pillanatkép-mechanizmussal történik (frissítés után nem
 * keveredik a régi és az új kód).
 */

import { existsSync } from 'fs';
import path from 'path';
import { getPluginDir } from '$lib/server/plugins/utils/filesystem';
import { resolveServerModuleUrl } from '$lib/server/plugins/utils/server-snapshot';
import type { JobHandler } from './types';

/** Érvényes JS azonosító — a modul exportjai közül csak ilyet hívunk */
const HANDLER_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** A plugin jobs moduljának útvonala (.js az elsődleges, .ts a tartalék), vagy null. */
export function findJobsModule(pluginId: string): string | null {
	const serverDir = path.join(getPluginDir(pluginId), 'server');
	for (const file of ['jobs.js', 'jobs.ts']) {
		const candidate = path.join(serverDir, file);
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

export async function loadJobHandler(pluginId: string, handler: string): Promise<JobHandler> {
	if (!HANDLER_NAME_PATTERN.test(handler)) {
		throw new Error(`Invalid job handler name: ${handler}`);
	}
	const modulePath = findJobsModule(pluginId);
	if (!modulePath) {
		throw new Error(`The plugin has no server/jobs module: ${pluginId}`);
	}
	const fileUrl = await resolveServerModuleUrl(getPluginDir(pluginId), modulePath);
	const jobsModule = await import(/* @vite-ignore */ fileUrl);
	// Csak a modul saját exportjai hívhatók (prototípus-lánc, pl. constructor, nem)
	const fn = Object.prototype.hasOwnProperty.call(jobsModule, handler)
		? jobsModule[handler]
		: undefined;
	if (typeof fn !== 'function') {
		throw new Error(`Job handler '${handler}' not found in ${pluginId}/server/jobs`);
	}
	return fn as JobHandler;
}
