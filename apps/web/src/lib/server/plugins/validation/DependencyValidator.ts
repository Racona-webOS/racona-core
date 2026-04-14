/**
 * Dependency Validator
 *
 * Függőségek fehérlista alapú validálása.
 */

import type { DependencyValidationResult } from '@racona/database';

/**
 * Engedélyezett függőségek fehérlistája
 */
export const DEPENDENCY_WHITELIST = [
	// Svelte
	{ name: 'svelte', versionPattern: /^\^?5\.\d+\.\d+$/ },

	// Lucide Icons
	{ name: 'lucide-svelte', versionPattern: /^\^?0\.\d+\.\d+$/ },
	{ name: '@lucide/svelte', versionPattern: /^\^?[01]\.\d+\.\d+$/ },

	// Elyos packages (minden verzió engedélyezett)
	{ name: '@elyos/*', versionPattern: /.*/ }
] as const;

/**
 * Dependency Validator osztály
 */
export class DependencyValidator {
	/**
	 * Függőségek validálása
	 *
	 * @param dependencies - Függőségek objektuma (package name -> version)
	 * @returns Validálási eredmény
	 */
	validate(dependencies: Record<string, string>): DependencyValidationResult {
		const invalidDependencies: string[] = [];

		if (!dependencies || typeof dependencies !== 'object') {
			return {
				valid: true,
				invalidDependencies: []
			};
		}

		for (const [packageName, version] of Object.entries(dependencies)) {
			if (!this.isAllowed(packageName, version)) {
				invalidDependencies.push(`${packageName}@${version}`);
			}
		}

		return {
			valid: invalidDependencies.length === 0,
			invalidDependencies
		};
	}

	/**
	 * Egyedi függőség ellenőrzése
	 *
	 * @param packageName - Package neve
	 * @param version - Verzió string
	 * @returns Engedélyezett-e
	 */
	private isAllowed(packageName: string, version: string): boolean {
		for (const allowed of DEPENDENCY_WHITELIST) {
			// Wildcard támogatás (@elyos/*)
			if (allowed.name.endsWith('/*')) {
				const prefix = allowed.name.slice(0, -2); // Remove /*
				if (packageName.startsWith(prefix)) {
					return allowed.versionPattern.test(version);
				}
			}

			// Pontos egyezés
			if (allowed.name === packageName) {
				return allowed.versionPattern.test(version);
			}
		}

		return false;
	}

	/**
	 * Fehérlista lekérdezése (admin célokra)
	 */
	getWhitelist(): Array<{ name: string; versionPattern: string }> {
		return DEPENDENCY_WHITELIST.map((item) => ({
			name: item.name,
			versionPattern: item.versionPattern.source
		}));
	}

	/**
	 * Függőség hozzáadása a fehérlistához (runtime)
	 *
	 * Megjegyzés: Ez csak a memóriában módosít, nem perzisztens.
	 * Perzisztens módosításhoz a DEPENDENCY_WHITELIST konstanst kell frissíteni.
	 */
	addToWhitelist(packageName: string, versionPattern: RegExp): void {
		// @ts-expect-error - Runtime módosítás
		DEPENDENCY_WHITELIST.push({ name: packageName, versionPattern });
	}

	/**
	 * Verzió range validálás
	 *
	 * Ellenőrzi, hogy a verzió string érvényes-e.
	 */
	isValidVersionRange(version: string): boolean {
		// Támogatott formátumok:
		// - Pontos verzió: 1.0.0
		// - Caret range: ^1.0.0
		// - Tilde range: ~1.0.0
		// - Wildcard: 1.x, 1.*, *
		// - Range: >=1.0.0 <2.0.0

		const versionPatterns = [
			/^\d+\.\d+\.\d+$/, // 1.0.0
			/^\^?\d+\.\d+\.\d+$/, // ^1.0.0
			/^~\d+\.\d+\.\d+$/, // ~1.0.0
			/^\d+\.(x|\*)$/, // 1.x, 1.*
			/^\*$/, // *
			/^>=?\d+\.\d+\.\d+\s*<?\d+\.\d+\.\d+$/ // >=1.0.0 <2.0.0
		];

		return versionPatterns.some((pattern) => pattern.test(version));
	}
}

/**
 * Singleton instance
 */
export const dependencyValidator = new DependencyValidator();
