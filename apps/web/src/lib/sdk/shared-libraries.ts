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
	'@elyos/utils': { cn }
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
 * Ez a függvény a Desktop komponens mount-jakor fut le.
 */
export function initializeSharedLibraries(): void {
	if (typeof window === 'undefined') {
		console.warn('[Shared Libraries] Cannot initialize in non-browser environment');
		return;
	}

	// Ellenőrizzük, hogy már inicializálva van-e
	if ((window as any).__ELYOS_SHARED_LIBS__) {
		console.log('[Shared Libraries] Already initialized, skipping');
		return;
	}

	// Regisztráljuk a shared libraries-t
	(window as any).__ELYOS_SHARED_LIBS__ = SHARED_LIBRARIES;

	console.log('[Shared Libraries] Initialized:', Object.keys(SHARED_LIBRARIES).join(', '));

	// Verzió információk logolása (ha elérhető)
	Object.entries(SHARED_LIBRARIES).forEach(([name, lib]) => {
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
