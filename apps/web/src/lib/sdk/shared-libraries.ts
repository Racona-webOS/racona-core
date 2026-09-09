/**
 * Shared Libraries Registry
 *
 * Ezek a library-k elérhetők lesznek a pluginok számára az SDK-n keresztül.
 * Ez csökkenti a plugin bundle méretét és biztosítja a verzió konzisztenciát.
 *
 * @example
 * ```ts
 * // Plugin kódban:
 * const sdk = window.webOS;
 * const lucide = sdk.libs.lucide;
 * const { Check } = lucide;
 * ```
 */

// UI & Icons
import * as lucideSvelte from 'lucide-svelte';
import * as phosphorSvelte from 'phosphor-svelte';

// Maps
import * as svelteMaplibreGl from 'svelte-maplibre-gl';

// Data & Tables
import * as tanstackTableCore from '@tanstack/table-core';

// Utilities
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cn } from '$lib/utils';

/**
 * Shared libraries registry.
 * Ezek a library-k automatikusan elérhetők lesznek minden plugin számára.
 *
 * A Svelte runtime (svelte, svelte/internal/client) megosztása kritikus,
 * de ezek dinamikusan, csak browserben töltődnek be (lásd
 * `initializeSharedLibraries`), hogy az SSR build ne próbálja a
 * `svelte/internal/client`-et szerver oldalon kiértékelni.
 */
export const SHARED_LIBRARIES = {
	// ─── Icons ──────────────────────────────────────────────────────
	'lucide-svelte': lucideSvelte,
	'phosphor-svelte': phosphorSvelte,

	// ─── Maps ───────────────────────────────────────────────────────
	'svelte-maplibre-gl': svelteMaplibreGl,

	// ─── Data & Tables ──────────────────────────────────────────────
	'@tanstack/table-core': tanstackTableCore,

	// ─── Utilities ──────────────────────────────────────────────────
	clsx: clsx,
	'tailwind-merge': { twMerge },
	'@racona/utils': { cn }
} as const;

/**
 * Shared libraries típusa.
 */
export type SharedLibraries = typeof SHARED_LIBRARIES;

/**
 * Shared library nevek.
 */
export type SharedLibraryName = keyof SharedLibraries;

/**
 * Initialize shared libraries on the global window object.
 * Ez a függvény a Desktop komponens mount-jakor fut le, browserben.
 *
 * A Svelte runtime modulokat (svelte, svelte/internal/client) dinamikus
 * importtal töltjük be, mert ezek SSR környezetben nem értelmezhetők
 * (csak kliens oldali API-k).
 */
let initPromise: Promise<void> | null = null;

export function initializeSharedLibraries(): Promise<void> {
	if (initPromise) return initPromise;
	initPromise = doInitialize();
	return initPromise;
}

/**
 * Vár a shared libraries inicializálódására.
 * A plugin loader hívja, mielőtt egy plugint mountolna.
 */
export function sharedLibrariesReady(): Promise<void> {
	return initPromise ?? initializeSharedLibraries();
}

async function doInitialize(): Promise<void> {
	if (typeof window === 'undefined') {
		console.warn('[Shared Libraries] Cannot initialize in non-browser environment');
		return;
	}

	// Ellenőrizzük, hogy már inicializálva van-e
	if ((window as any).__RACONA_SHARED_LIBS__) {
		console.log('[Shared Libraries] Already initialized, skipping');
		return;
	}

	// Svelte runtime betöltése dinamikusan (csak browserben).
	// A `svelte/internal/client` nem exportál típusokat — runtime-only modul.
	const [svelte, svelteInternalClient] = await Promise.all([
		import('svelte'),
		// @ts-expect-error - svelte/internal/client has no .d.ts (runtime-only)
		import('svelte/internal/client')
	]);

	const allLibraries = {
		...SHARED_LIBRARIES,
		svelte,
		'svelte/internal/client': svelteInternalClient
	};

	// Regisztráljuk a shared libraries-t
	(window as any).__RACONA_SHARED_LIBS__ = allLibraries;

	// A Svelte runtime modulokat külön globálban is kitesszük, hogy az
	// IIFE-be fordított pluginok rollupOptions.output.globals-on keresztül
	// ezekre a JS-azonosítókra tudjanak hivatkozni (a Vite IIFE globals
	// érték JS azonosító kell legyen, nem string indexelt window kulcs).
	(window as any).__RACONA_SVELTE__ = svelte;
	(window as any).__RACONA_SVELTE_INTERNAL_CLIENT__ = svelteInternalClient;

	console.log('[Shared Libraries] Initialized:', Object.keys(allLibraries).join(', '));

	// Verzió információk logolása (ha elérhető)
	Object.entries(allLibraries).forEach(([name, lib]) => {
		const version = (lib as any)?.version || (lib as any)?.VERSION;
		if (version) {
			console.log(`  - ${name}@${version}`);
		}
	});
}

/**
 * Get a shared library by name.
 * Csak szerver oldalon használható (SSR).
 */
export function getSharedLibrary<K extends SharedLibraryName>(
	name: K
): SharedLibraries[K] | undefined {
	return SHARED_LIBRARIES[name];
}

/**
 * Check if a library is available in the shared registry.
 */
export function hasSharedLibrary(name: string): name is SharedLibraryName {
	return name in SHARED_LIBRARIES;
}
