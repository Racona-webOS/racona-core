/**
 * Manifest Validator
 *
 * manifest.json fájl validálása.
 */

import type { PluginManifest, ValidationError } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import * as v from 'valibot';
import { getSchedulerConfig } from '$lib/server/scheduler/config';
import { isValidTimezone, validateSchedule } from '$lib/server/scheduler/cron';

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
	v.literal('user_data'),
	v.literal('scheduler')
]);

// Lokalizált szöveg séma - lehet string vagy objektum
const localizedTextSchema = v.union([
	v.string(),
	v.record(v.string(), v.string()) // { hu: "...", en: "...", ... }
]);

/** Egy plugin legfeljebb ennyi ütemezett feladatot deklarálhat. */
export const MAX_SCHEDULED_JOBS = 20;

// Ütemezett feladat séma (a cron és az időzóna tartalmi ellenőrzése a validate()-ben)
const scheduledJobSchema = v.object({
	id: v.pipe(
		v.string(),
		v.minLength(3, 'Scheduled job ID must be at least 3 characters'),
		v.maxLength(50, 'Scheduled job ID must be at most 50 characters'),
		v.regex(/^[a-z0-9-]+$/, 'Scheduled job ID must be kebab-case')
	),
	handler: v.pipe(
		v.string(),
		v.regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, 'Scheduled job handler must be a valid identifier'),
		v.maxLength(100, 'Scheduled job handler must be at most 100 characters')
	),
	schedule: v.pipe(v.string(), v.minLength(9, 'Schedule must be a 5-field cron expression')),
	timezone: v.optional(v.pipe(v.string(), v.minLength(1))),
	description: v.optional(localizedTextSchema),
	timeoutSeconds: v.optional(
		v.pipe(
			v.number(),
			v.integer(),
			v.minValue(10, 'timeoutSeconds must be at least 10'),
			v.maxValue(3600, 'timeoutSeconds must be at most 3600')
		)
	),
	catchUp: v.optional(v.union([v.literal('once'), v.literal('skip')]))
});

/** Egy plugin legfeljebb ennyi mobil bejegyzést deklarálhat. */
export const MAX_MOBILE_ENTRIES = 12;

// Mobil bejegyzés séma (az egyediség ellenőrzése a validate()-ben)
const mobileEntrySchema = v.object({
	id: v.pipe(
		v.string(),
		v.regex(/^[a-z0-9-]+$/, 'Mobile entry ID must be kebab-case'),
		v.maxLength(50, 'Mobile entry ID must be at most 50 characters')
	),
	label: localizedTextSchema,
	icon: v.optional(v.string()),
	component: v.pipe(v.string(), v.minLength(1, 'Mobile entry component is required'))
});

const mobileSchema = v.object({
	entries: v.pipe(
		v.array(mobileEntrySchema),
		v.maxLength(MAX_MOBILE_ENTRIES, `At most ${MAX_MOBILE_ENTRIES} mobile entries are allowed`)
	)
});

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
	sortOrder: v.optional(v.number()),
	sidebarComponent: v.optional(v.string()),
	scheduledJobs: v.optional(
		v.pipe(
			v.array(scheduledJobSchema),
			v.maxLength(MAX_SCHEDULED_JOBS, `At most ${MAX_SCHEDULED_JOBS} scheduled jobs are allowed`)
		)
	),
	mobile: v.optional(mobileSchema)
});

/**
 * Az ütemezett feladatok tartalmi ellenőrzése: a `scheduler` jog megléte,
 * egyedi azonosítók, érvényes időzóna és cron kifejezés (legalább 5 perc két futás között).
 */
function validateScheduledJobs(manifest: PluginManifest): ValidationError[] {
	const errors: ValidationError[] = [];
	const jobs = manifest.scheduledJobs ?? [];

	if (!manifest.permissions.includes('scheduler')) {
		errors.push({
			code: PluginErrorCode.INVALID_MANIFEST,
			message: "scheduledJobs requires the 'scheduler' permission",
			field: 'permissions'
		});
	}

	const seen = new Set<string>();
	const defaultTimezone = getSchedulerConfig().defaultTimezone;
	jobs.forEach((job, index) => {
		const field = `scheduledJobs.${index}`;
		if (seen.has(job.id)) {
			errors.push({
				code: PluginErrorCode.INVALID_MANIFEST,
				message: `Duplicate scheduled job ID: ${job.id}`,
				field: `${field}.id`
			});
		}
		seen.add(job.id);

		if (job.timezone !== undefined && !isValidTimezone(job.timezone)) {
			errors.push({
				code: PluginErrorCode.INVALID_MANIFEST,
				message: `Invalid timezone: ${job.timezone}`,
				field: `${field}.timezone`
			});
			return;
		}

		const problem = validateSchedule(job.schedule, job.timezone ?? defaultTimezone);
		if (problem) {
			errors.push({
				code: PluginErrorCode.INVALID_MANIFEST,
				message: `Invalid schedule for ${job.id}: ${problem}`,
				field: `${field}.schedule`
			});
		}
	});

	return errors;
}

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

			// Ütemezett feladatok (ha vannak)
			if (manifest.scheduledJobs?.length) {
				errors.push(...validateScheduledJobs(manifest));
			}

			// Mobil bejegyzések azonosítói egyediek
			const mobileIds = new Set<string>();
			manifest.mobile?.entries.forEach((entry, index) => {
				if (mobileIds.has(entry.id)) {
					errors.push({
						code: PluginErrorCode.INVALID_MANIFEST,
						message: `Duplicate mobile entry ID: ${entry.id}`,
						field: `mobile.entries.${index}.id`
					});
				}
				mobileIds.add(entry.id);
			});

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
