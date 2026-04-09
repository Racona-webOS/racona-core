/**
 * Mock Shared Libraries Service
 *
 * Mock implementation for standalone plugin development.
 * Returns undefined for all libraries since they're not available in dev mode.
 */

import type { SharedLibrariesService as ISharedLibrariesService } from '../../types/index.js';

/** Mock Shared Libraries service — returns undefined for all libraries in dev mode */
export class MockSharedLibrariesService implements ISharedLibrariesService {
	/** Map of mock library name → library exports */
	private mockLibraries: Record<string, any> = {};

	/** @param mockLibraries - Optional map of mock libraries to make available */
	constructor(mockLibraries?: Record<string, any>) {
		this.mockLibraries = mockLibraries || {};

		if (Object.keys(this.mockLibraries).length > 0) {
			console.log(
				'[MockSharedLibrariesService] Mock libraries registered:',
				Object.keys(this.mockLibraries).join(', ')
			);
		}
	}

	/**
	 * Get a shared library by name.
	 * Returns undefined in dev mode unless explicitly mocked.
	 * @param libraryName - Name of the library
	 * @returns The library exports, or undefined
	 */
	get(libraryName: string): any {
		const lib = this.mockLibraries[libraryName];
		if (!lib) {
			console.warn(
				`[MockSharedLibrariesService] Library "${libraryName}" not available in dev mode. ` +
					`Install it locally or provide a mock in MockSDKConfig.libs.mockLibraries`
			);
		}
		return lib;
	}

	/**
	 * Check if a library is available.
	 * @param libraryName - Name of the library to check
	 * @returns True if the library is mocked, false otherwise
	 */
	has(libraryName: string): boolean {
		return libraryName in this.mockLibraries;
	}

	/**
	 * Get all available shared libraries.
	 * @returns Array of mocked library names
	 */
	list(): string[] {
		return Object.keys(this.mockLibraries);
	}

	/**
	 * Get library version information.
	 * @param libraryName - Name of the library
	 * @returns Version string if available, undefined otherwise
	 */
	version(libraryName: string): string | undefined {
		const lib = this.get(libraryName);
		return lib?.version || lib?.VERSION || undefined;
	}

	// ─── Convenience Getters ────────────────────────────────────────

	/** Lucide Svelte icons library */
	get lucide(): any {
		return this.get('lucide-svelte');
	}

	/** Phosphor Svelte icons library */
	get phosphor(): any {
		return this.get('phosphor-svelte');
	}

	/** Svelte MapLibre GL library */
	get maplibre(): any {
		return this.get('svelte-maplibre-gl');
	}

	/** TanStack Table Core library */
	get tanstackTable(): any {
		return this.get('@tanstack/table-core');
	}

	/** Clsx utility for conditional class names */
	get clsx(): any {
		return this.get('clsx');
	}

	/** Tailwind Merge utility */
	get tailwindMerge(): any {
		return this.get('tailwind-merge');
	}
}
