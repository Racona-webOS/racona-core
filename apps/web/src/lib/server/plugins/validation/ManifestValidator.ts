/**
 * Manifest Validator
 *
 * manifest.json fájl validálása.
 */

import type { PluginManifest, ValidationError } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import * as v from 'valibot';

/**
 * Manifest validálási eredmény
 */
export interface ManifestValidationResult {
	valid: boolean;
	errors: ValidationError[];
	manifest?: PluginManifest;
}

/**
 * Valibot séma a manifest validálásához
 */
const pluginPermissionSchema = v.union([
	v.literal('database'),
	v.literal('notifications'),
	v.literal('file_access'),
	v.literal('remote_functions'),
	v.literal('user_data')
]);

// Lokalizált szöveg séma - lehet string vagy objektum
const localizedTextSchema = v.union([
	v.string(),
	v.record(v.string(), v.string()) // { hu: "...", en: "...", ... }
]);

const pluginManifestSchema = v.object({
	id: v.pipe(
		v.string(),
		v.minLength(3, 'Plugin ID must be at least 3 characters'),
		v.maxLength(50, 'Plugin ID must be at most 50 characters'),
		v.regex(
			/^[a-z0-9-]+$/,
			'Plugin ID must be kebab-case (lowercase letters, numbers, and hyphens only)'
		)
	),
	name: localizedTextSchema,
	version: v.pipe(
		v.string(),
		v.regex(
			/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/,
			'Version must follow semantic versioning (e.g., 1.0.0)'
		)
	),
	description: localizedTextSchema,
	author: v.pipe(
		v.string(),
		v.minLength(1, 'Author is required'),
		v.maxLength(255, 'Author must be at most 255 characters')
	),
	entry: v.pipe(
		v.string(),
		v.minLength(1, 'Entry point is required'),
		v.regex(/\.(js|mjs|cjs)$/, 'Entry point must be a JavaScript file (.js, .mjs, or .cjs)')
	),
	icon: v.pipe(v.string(), v.minLength(1, 'Icon path is required')),
	iconStyle: v.optional(v.union([v.literal('icon'), v.literal('cover')])),
	category: v.optional(v.string()),
	permissions: v.array(pluginPermissionSchema),
	multiInstance: v.optional(v.boolean()),
	defaultSize: v.optional(
		v.object({
			width: v.number(),
			height: v.number(),
			maximized: v.optional(v.boolean())
		})
	),
	minSize: v.optional(
		v.object({
			width: v.number(),
			height: v.number()
		})
	),
	maxSize: v.optional(
		v.object({
			width: v.number(),
			height: v.number()
		})
	),
	keywords: v.optional(v.array(v.string())),
	dependencies: v.optional(v.record(v.string(), v.string())),
	minWebOSVersion: v.optional(
		v.pipe(
			v.string(),
			v.regex(/^\d+\.\d+\.\d+$/, 'minWebOSVersion must follow semantic versioning')
		)
	),
	locales: v.optional(v.array(v.string())),
	signature: v.optional(v.string()),
	isPublic: v.optional(v.boolean()),
	sortOrder: v.optional(v.number())
});

/**
 * Manifest Validator osztály
 */
export class ManifestValidator {
	/**
	 * Manifest validálása
	 *
	 * @param manifestContent - Manifest JSON string vagy objektum
	 * @returns Validálási eredmény
	 */
	validate(manifestContent: string | unknown): ManifestValidationResult {
		const errors: ValidationError[] = [];

		try {
			// JSON parsing ha string
			let manifestData: unknown;

			if (typeof manifestContent === 'string') {
				try {
					manifestData = JSON.parse(manifestContent);
				} catch (error) {
					errors.push({
						code: PluginErrorCode.INVALID_MANIFEST,
						message: 'Invalid JSON format in manifest.json',
						details: error instanceof Error ? error.message : String(error)
					});
					return { valid: false, errors };
				}
			} else {
				manifestData = manifestContent;
			}

			// Típus ellenőrzés
			if (typeof manifestData !== 'object' || manifestData === null) {
				errors.push({
					code: PluginErrorCode.INVALID_MANIFEST,
					message: 'Manifest must be a JSON object'
				});
				return { valid: false, errors };
			}

			// Valibot validálás
			const result = v.safeParse(pluginManifestSchema, manifestData);

			if (!result.success) {
				// Valibot hibák konvertálása ValidationError formátumra
				for (const issue of result.issues) {
					const field = issue.path?.map((p) => p.key).join('.') || 'unknown';

					errors.push({
						code: PluginErrorCode.MISSING_REQUIRED_FIELD,
						message: issue.message,
						field
					});
				}

				return { valid: false, errors };
			}

			const manifest = result.output as PluginManifest;

			// További validálások

			// Email formátum ellenőrzés az author mezőben (opcionális)
			if (manifest.author.includes('@')) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				const emailMatch = manifest.author.match(/<(.+)>/) || [null, manifest.author];
				const email = emailMatch[1];

				if (email && !emailRegex.test(email)) {
					errors.push({
						code: PluginErrorCode.INVALID_MANIFEST,
						message: 'Invalid email format in author field',
						field: 'author'
					});
				}
			}

			// Függőségek validálása (ha vannak)
			if (manifest.dependencies) {
				for (const [dep, version] of Object.entries(manifest.dependencies)) {
					if (!version || typeof version !== 'string') {
						errors.push({
							code: PluginErrorCode.INVALID_MANIFEST,
							message: `Invalid version for dependency: ${dep}`,
							field: 'dependencies'
						});
					}
				}
			}

			// Locales validálása (ha vannak)
			if (manifest.locales) {
				const validLocales = /^[a-z]{2}(-[A-Z]{2})?$/;
				for (const locale of manifest.locales) {
					if (!validLocales.test(locale)) {
						errors.push({
							code: PluginErrorCode.INVALID_MANIFEST,
							message: `Invalid locale format: ${locale}. Expected format: 'en' or 'en-US'`,
							field: 'locales'
						});
					}
				}
			}

			if (errors.length > 0) {
				return { valid: false, errors };
			}

			return {
				valid: true,
				errors: [],
				manifest
			};
		} catch (error) {
			errors.push({
				code: PluginErrorCode.INVALID_MANIFEST,
				message: 'Unexpected error during manifest validation',
				details: error instanceof Error ? error.message : String(error)
			});

			return { valid: false, errors };
		}
	}

	/**
	 * Manifest round-trip teszt
	 *
	 * Ellenőrzi, hogy a manifest parse → stringify → parse után ugyanaz marad-e.
	 */
	testRoundTrip(manifest: PluginManifest): boolean {
		try {
			const stringified = JSON.stringify(manifest);
			const parsed = JSON.parse(stringified);
			const reStringified = JSON.stringify(parsed);

			return stringified === reStringified;
		} catch {
			return false;
		}
	}

	/**
	 * Manifest pretty print
	 */
	print(manifest: PluginManifest): string {
		return JSON.stringify(manifest, null, 2);
	}
}

/**
 * Singleton instance
 */
export const manifestValidator = new ManifestValidator();
