/**
 * Plugin Validator (Orchestrator)
 *
 * Összes validátor koordinálása és teljes plugin csomag validálása.
 */

import type { ValidationReport, PluginManifest } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import { zipValidator } from './ZipValidator';
import { manifestValidator } from './ManifestValidator';
import { codeScanner } from './CodeScanner';
import { dependencyValidator } from './DependencyValidator';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';

/**
 * Plugin Validator osztály
 *
 * Koordinálja az összes validátort és teljes validációs jelentést készít.
 */
export class PluginValidator {
	/**
	 * Teljes plugin csomag validálása
	 *
	 * @param packagePath - Plugin csomag fájl útvonala (kiterjesztés: környezeti változóból)
	 * @returns Validációs jelentés
	 */
	async validate(packagePath: string): Promise<ValidationReport> {
		const startTime = Date.now();
		const report: ValidationReport = {
			valid: false,
			errors: [],
			warnings: []
		};

		try {
			// 1. ZIP struktúra validálás
			console.log('[PluginValidator] Validating ZIP structure...');
			const zipResult = await zipValidator.validate(packagePath);

			if (!zipResult.valid) {
				report.errors.push(...zipResult.errors);
				return report;
			}

			const files = zipResult.files!;

			// 2. Manifest validálás
			console.log('[PluginValidator] Validating manifest...');
			const manifestBuffer = zipValidator.findFile(files, 'manifest.json');

			if (!manifestBuffer) {
				report.errors.push({
					code: PluginErrorCode.MISSING_MANIFEST,
					message: 'manifest.json not found in package'
				});
				return report;
			}

			const manifestContent = manifestBuffer.toString('utf-8');
			const manifestResult = manifestValidator.validate(manifestContent);

			if (!manifestResult.valid) {
				report.errors.push(...manifestResult.errors);
				return report;
			}

			const manifest = manifestResult.manifest!;
			report.manifest = manifest;

			// 3. Plugin ID egyediség ellenőrzés
			console.log('[PluginValidator] Checking plugin ID uniqueness...');
			const isUnique = await this.checkPluginIdUniqueness(manifest.id);

			if (!isUnique) {
				report.errors.push({
					code: PluginErrorCode.DUPLICATE_PLUGIN_ID,
					message: `Plugin with ID '${manifest.id}' already exists`,
					details: {
						pluginId: manifest.id
					}
				});
				return report;
			}

			// 4. Kód szkennelés (párhuzamosan a függőség validálással)
			console.log('[PluginValidator] Scanning code and validating dependencies...');
			const [codeScanResult, dependencyResult] = await Promise.all([
				codeScanner.scanCode(files),
				Promise.resolve(dependencyValidator.validate(manifest.dependencies || {}))
			]);

			// Kód szkennelés eredmények
			if (!codeScanResult.passed) {
				for (const pattern of codeScanResult.dangerousPatterns) {
					report.errors.push({
						code: PluginErrorCode.DANGEROUS_CODE_PATTERN,
						message: `Dangerous pattern '${pattern.pattern}' found in ${pattern.file}:${pattern.line}`,
						details: {
							file: pattern.file,
							line: pattern.line,
							context: pattern.context
						}
					});
				}
			}

			// Függőség validálás eredmények
			if (!dependencyResult.valid) {
				for (const dep of dependencyResult.invalidDependencies) {
					report.errors.push({
						code: PluginErrorCode.INVALID_DEPENDENCY,
						message: `Dependency '${dep}' is not allowed`,
						field: 'dependencies'
					});
				}
			}

			// 5. Manifest round-trip teszt (figyelmeztetés ha sikertelen)
			const roundTripOk = manifestValidator.testRoundTrip(manifest);
			if (!roundTripOk) {
				report.warnings.push({
					code: 'MANIFEST_ROUNDTRIP_FAILED',
					message: 'Manifest round-trip test failed (non-critical)',
					field: 'manifest'
				});
			}

			// 6. Entry point fájl létezés ellenőrzés
			const entryFile = zipValidator.findFile(files, manifest.entry);
			if (!entryFile) {
				report.errors.push({
					code: PluginErrorCode.INVALID_MANIFEST,
					message: `Entry point file '${manifest.entry}' not found in package`,
					field: 'entry'
				});
			}

			// 7. Icon ellenőrzés és betöltés
			// Ha az icon Lucide ikon név (nagybetűvel kezdődik), akkor nem kell fájl
			const isLucideIcon = /^[A-Z][a-zA-Z0-9]*$/.test(manifest.icon);
			let iconData: string | undefined;

			if (!isLucideIcon) {
				// Fájl alapú ikon - ellenőrizzük, hogy létezik-e
				const iconFile = zipValidator.findFile(files, manifest.icon);
				if (!iconFile) {
					report.warnings.push({
						code: 'ICON_NOT_FOUND',
						message: `Icon file '${manifest.icon}' not found in package`,
						field: 'icon'
					});
				} else {
					// Ikon betöltése base64 formátumban
					const iconExtension = manifest.icon.split('.').pop()?.toLowerCase();
					let mimeType = 'image/png';

					if (iconExtension === 'svg') {
						mimeType = 'image/svg+xml';
					} else if (iconExtension === 'jpg' || iconExtension === 'jpeg') {
						mimeType = 'image/jpeg';
					} else if (iconExtension === 'gif') {
						mimeType = 'image/gif';
					} else if (iconExtension === 'webp') {
						mimeType = 'image/webp';
					}

					iconData = `data:${mimeType};base64,${iconFile.toString('base64')}`;
				}
			}

			// Ikon adat hozzáadása a manifest-hez (ha van)
			if (iconData) {
				(report.manifest as any).iconData = iconData;
			}

			// 8. Locales fájlok ellenőrzése (ha vannak)
			if (manifest.locales && manifest.locales.length > 0) {
				for (const locale of manifest.locales) {
					const localeFile = zipValidator.findFile(files, `locales/${locale}.json`);
					if (!localeFile) {
						report.warnings.push({
							code: 'LOCALE_FILE_NOT_FOUND',
							message: `Locale file 'locales/${locale}.json' not found`,
							field: 'locales'
						});
					}
				}
			}

			// Validálás sikeres ha nincsenek hibák
			report.valid = report.errors.length === 0;

			const duration = Date.now() - startTime;
			console.log(
				`[PluginValidator] Validation completed in ${duration}ms - Valid: ${report.valid}`
			);

			return report;
		} catch (error) {
			console.error('[PluginValidator] Validation error:', error);

			report.errors.push({
				code: PluginErrorCode.INVALID_ZIP,
				message: 'Unexpected error during validation',
				details: error instanceof Error ? error.message : String(error)
			});

			return report;
		}
	}

	/**
	 * Plugin ID egyediség ellenőrzése az adatbázisban
	 *
	 * @param pluginId - Ellenőrizendő plugin ID
	 * @returns True ha egyedi, false ha már létezik
	 */
	async checkPluginIdUniqueness(pluginId: string): Promise<boolean> {
		try {
			const existing = await db
				.select({ id: apps.id })
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			return existing.length === 0;
		} catch (error) {
			console.error('[PluginValidator] Error checking plugin ID uniqueness:', error);
			// Hiba esetén inkább engedjük tovább (false positive helyett false negative)
			return true;
		}
	}

	/**
	 * Gyors validálás (csak manifest és ZIP struktúra)
	 *
	 * Használható előzetes ellenőrzéshez.
	 */
	async quickValidate(packagePath: string): Promise<{
		valid: boolean;
		manifest?: PluginManifest;
		errors: string[];
	}> {
		const errors: string[] = [];

		// ZIP validálás
		const zipResult = await zipValidator.validate(packagePath);
		if (!zipResult.valid) {
			errors.push(...zipResult.errors.map((e) => e.message));
			return { valid: false, errors };
		}

		// Manifest validálás
		const manifestBuffer = zipValidator.findFile(zipResult.files!, 'manifest.json');
		if (!manifestBuffer) {
			errors.push('manifest.json not found');
			return { valid: false, errors };
		}

		const manifestResult = manifestValidator.validate(manifestBuffer.toString('utf-8'));
		if (!manifestResult.valid) {
			errors.push(...manifestResult.errors.map((e) => e.message));
			return { valid: false, errors };
		}

		return {
			valid: true,
			manifest: manifestResult.manifest,
			errors: []
		};
	}
}

/**
 * Singleton instance
 */
export const pluginValidator = new PluginValidator();
