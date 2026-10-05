/**
 * Plugin és core ütemezett feladatok (.kiro/specs/plugin-scheduler).
 *
 * A `hooks.server.ts` `init` hookja indítja. A példány a `globalThis`-en él,
 * hogy dev módban a hooks modul újratöltése (HMR) ne indítson második ciklust:
 * az új indítás a régit leállítja.
 */

import { building, dev } from '$app/environment';
import { Scheduler } from './runner';

const GLOBAL_KEY = Symbol.for('racona.scheduler');

type SchedulerGlobal = typeof globalThis & { [GLOBAL_KEY]?: Scheduler };

let shutdownHookInstalled = false;

/** Az ütemező indítása (idempotens; dev HMR esetén újraindít). */
export function startScheduler(): Scheduler | null {
	if (building) return null;
	const g = globalThis as SchedulerGlobal;
	const previous = g[GLOBAL_KEY];
	if (previous && !dev) return previous;
	if (previous) void previous.stop(0);

	const scheduler = new Scheduler();
	g[GLOBAL_KEY] = scheduler;
	void scheduler.start();
	installShutdownHook();
	return scheduler;
}

/** A futó ütemező, vagy null (pl. buildelés közben). */
export function getScheduler(): Scheduler | null {
	return (globalThis as SchedulerGlobal)[GLOBAL_KEY] ?? null;
}

export async function stopScheduler(timeoutMs?: number): Promise<void> {
	await getScheduler()?.stop(timeoutMs);
}

/**
 * Production leállításkor (SIGTERM) az ütemező nem indít új feladatot, és
 * legfeljebb 10 másodpercig vár a futókra. Ha rajtunk kívül senki nem kezeli a
 * jelet, utána kilépünk (a figyelő felrakása kikapcsolja az alapértelmezett kilépést).
 */
function installShutdownHook(): void {
	if (dev || shutdownHookInstalled) return;
	shutdownHookInstalled = true;
	process.once('SIGTERM', () => {
		void stopScheduler(10_000).finally(() => {
			if (process.listenerCount('SIGTERM') === 0) process.exit(0);
		});
	});
}

export { Scheduler, SchedulerError, jobLabel, SCHEDULER_MANAGE_PERMISSION } from './runner';
export { syncPluginJobs, removePluginJobs, readInstalledManifest } from './registry';
export type { JobContext, JobParams, JobResult, JobHandler } from './types';
