/**
 * Shared Libraries Service
 *
 * Provides access to libraries installed in the ElyOS core.
 * This prevents plugins from bundling large dependencies, reducing bundle size
 * and ensuring version consistency across all plugins.
 *
 * @example
 * ```ts
 * const sdk = window.webOS;
 * const maplibre = sdk.libs.get('maplibre-gl');
 * if (maplibre) {
 *   const map = new maplibre.Map({ ... });
 * }
 * ```
 */

import type { SharedLibrariesService as ISharedLibrariesService } from '../../types/index.js';

/** Shared Libraries service — access to libraries installed in the ElyOS core */
export class SharedLibrariesService implements ISharedLibrariesService {
	/**
	 * Get a shared library by name.
	 * Returns undefined if the library is not available.
	 *
	 * @param libraryName - Name of the library (e.g. 'maplibre-gl', 'lucide-svelte')
	 * @returns The library exports, or undefined if not available
	 */
	get(libraryName: string): any {
		if (typeof window === 'undefined') return undefined;

		const libs = (window as any).__ELYOS_SHARED_LIBS__;
		return libs?.[libraryName];
	}

	/**
	 * Check if a library is available.
	 *
	 * @param libraryName - Name of the library to check
	 * @returns True if the library is available, false otherwise
	 */
	has(libraryName: string): boolean {
		return this.get(libraryName) !== undefined;
	}

	/**
	 * Get all available shared libraries.
	 *
	 * @returns Array of library names
	 */
	list(): string[] {
		if (typeof window === 'undefined') return [];

		const libs = (window as any).__ELYOS_SHARED_LIBS__;
		return libs ? Object.keys(libs) : [];
	}

	/**
	 * Get library version information.
	 *
	 * @param libraryName - Name of the library
	 * @returns Version string if available, undefined otherwise
	 */
	version(libraryName: string): string | undefined {
		const lib = this.get(libraryName);
		return lib?.version || lib?.VERSION || undefined;
	}

	// ─── Convenience Getters ────────────────────────────────────────

	/**
	 * Lucide Svelte icons library.
	 * @returns lucide-svelte exports or undefined
	 */
	get lucide(): any {
		return this.get('lucide-svelte');
	}

	/**
	 * Phosphor Svelte icons library.
	 * @returns phosphor-svelte exports or undefined
	 */
	get phosphor(): any {
		return this.get('phosphor-svelte');
	}

	/**
	 * Svelte MapLibre GL library.
	 * @returns svelte-maplibre-gl exports or undefined
	 */
	get maplibre(): any {
		return this.get('svelte-maplibre-gl');
	}

	/**
	 * TanStack Table Core library.
	 * @returns @tanstack/table-core exports or undefined
	 */
	get tanstackTable(): any {
		return this.get('@tanstack/table-core');
	}

	/**
	 * Clsx utility for conditional class names.
	 * @returns clsx function or undefined
	 */
	get clsx(): any {
		return this.get('clsx');
	}

	/**
	 * Tailwind Merge utility.
	 * @returns tailwind-merge exports or undefined
	 */
	get tailwindMerge(): any {
		return this.get('tailwind-merge');
	}
}
