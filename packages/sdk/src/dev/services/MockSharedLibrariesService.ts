/**
 * Mock Shared Libraries Service
 *
 * Mock implementation for standalone plugin development.
 * Returns undefined for all libraries since they're not available in dev mode.
 */

import type { SharedLibrariesService as ISharedLibrariesService } from '../../types/index.js';

/** Mock Shared Libraries service — returns undefined for all libraries in dev mode */
export class MockSharedLibrariesService implements ISharedLibrariesService {
	private mockLibraries: Record<string, any> = {};

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
	 */
	has(libraryName: string): boolean {
		return libraryName in this.mockLibraries;
	}

	/**
	 * Get all available shared libraries.
	 */
	list(): string[] {
		return Object.keys(this.mockLibraries);
	}

	/**
	 * Get library version information.
	 */
	version(libraryName: string): string | undefined {
		const lib = this.get(libraryName);
		return lib?.version || lib?.VERSION || undefined;
	}

	// ─── Convenience Getters ────────────────────────────────────────

	get lucide() {
		return this.get('lucide-svelte');
	}

	get phosphor() {
		return this.get('phosphor-svelte');
	}

	get maplibre() {
		return this.get('svelte-maplibre-gl');
	}

	get tanstackTable() {
		return this.get('@tanstack/table-core');
	}

	get clsx() {
		return this.get('clsx');
	}

	get tailwindMerge() {
		return this.get('tailwind-merge');
	}
}
