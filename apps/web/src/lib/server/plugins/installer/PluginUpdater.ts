/**
 * Plugin Updater
 *
 * Plugin frissítési mechanizmus: validáció, backup, fájlcsere, rollback.
 */

import type { BackupMeta, UpdateResult, ValidationReport, PluginManifest } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import { pluginValidator } from '../validation/PluginValidator';
import {
	getPluginDir,
	getBackupPath,
	copyDir,
	ensureDir,
	removeDir,
	PLUGIN_DIRS
} from '../utils/filesystem';
import db from '$lib/server/database';
import { apps, pluginLogs } from '@racona/database';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import { pluginInstaller } from './PluginInstaller';

// ============================================================================
// isVersionGreater segédfüggvény
// ============================================================================

/**
 * Két szemantikus verziószám összehasonlítása.
 *
 * @param incoming - Az érkező (új) verzió 'X.Y.Z' formátumban
 * @param installed - A telepített (régi) verzió 'X.Y.Z' formátumban
 * @returns true ha az érkező verzió nagyobb a telepítettnél, egyébként false
 *
 * Érvénytelen bemenet esetén false-t ad vissza, nem dob kivételt.
 */
export function isVersionGreater(incoming: string, installed: string): boolean {
	// Ellenőrzés: mindkét string 'X.Y.Z' formátumú semver legyen
	const semverRegex = /^\d+\.\d+\.\d+$/;
	if (!semverRegex.test(incoming) || !semverRegex.test(installed)) {
		return false;
	}

	const [inMajor, inMinor, inPatch] = incoming.split('.').map(Number);
	const [instMajor, instMinor, instPatch] = installed.split('.').map(Number);

	// Major összehasonlítás
	if (inMajor > instMajor) return true;
	if (inMajor < instMajor) return false;

	// Major egyenlő — minor összehasonlítás
	if (inMinor > instMinor) return true;
	if (inMinor < instMinor) return false;

	// Minor egyenlő — patch összehasonlítás
	return inPatch > instPatch;
}

// ============================================================================
// PluginUpdateValidator osztály
// ============================================================================

/**
 * Plugin frissítési csomag validátora.
 *
 * A meglévő PluginValidator.validate() logikát hívja meg (ZIP + manifest ellenőrzés),
 * de nem ellenőrzi az ID egyediségét (az már telepítve van), hanem ID-egyezést
 * és semver-összehasonlítást végez a telepített verzióval szemben.
 */
export class PluginUpdateValidator {
	/**
	 * Frissítési csomag validálása
	 *
	 * @param packagePath - Plugin frissítési csomag fájl útvonala
	 * @param pluginId - A frissítendő plugin azonosítója
	 * @returns Validációs jelentés (valid, errors, manifest)
	 *
	 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
	 */
	async validateForUpdate(packagePath: string, pluginId: string): Promise<ValidationReport> {
		const report: ValidationReport = {
			valid: false,
			errors: [],
			warnings: []
		};

		try {
			// 1. Plugin létezés ellenőrzése az adatbázisban
			// Req 1.4: Ha a pluginId nem szerepel az apps táblában → PLUGIN_NOT_FOUND
			let installedRecord: { pluginVersion: string | null } | undefined;
			try {
				const records = await db
					.select({ pluginVersion: apps.pluginVersion })
					.from(apps)
					.where(eq(apps.appId, pluginId))
					.limit(1);

				installedRecord = records[0];
			} catch (dbError) {
				report.errors.push({
					code: PluginErrorCode.PLUGIN_NOT_FOUND,
					message: `Database error while looking up plugin '${pluginId}'`,
					details: dbError instanceof Error ? dbError.message : String(dbError)
				});
				return report;
			}

			if (!installedRecord) {
				report.errors.push({
					code: PluginErrorCode.PLUGIN_NOT_FOUND,
					message: `Plugin '${pluginId}' not found in the registry`
				});
				return report;
			}

			const installedVersion = installedRecord.pluginVersion || '0.0.0';

			// 2. ZIP + manifest alapvalidáció a meglévő PluginValidator segítségével,
			//    az ID-egyediség ellenőrzése nélkül (az overrideUniquenessCheck-kel vezéreljük)
			// Req 1.1, 1.7: ZIP struktúra és manifest mezők validálása
			// Req 1.6: NEM ellenőrzi az ID egyediségét
			let baseReport: ValidationReport;
			try {
				baseReport = await this.validateBasePackage(packagePath);
			} catch (zipError) {
				// Req 1.7: Ha a packagePath nem olvasható / érvénytelen ZIP → INVALID_PACKAGE
				report.errors.push({
					code: PluginErrorCode.INVALID_PACKAGE,
					message: `Cannot read or parse plugin package: ${zipError instanceof Error ? zipError.message : String(zipError)}`
				});
				return report;
			}

			// Ha az alap ZIP/manifest validáció sikertelen, visszaadjuk a hibákat
			if (!baseReport.valid || !baseReport.manifest) {
				// INVALID_PACKAGE hibakódra cseréljük az INVALID_ZIP hibákat
				const remappedErrors = baseReport.errors.map((err) => ({
					...err,
					code:
						err.code === PluginErrorCode.INVALID_ZIP ? PluginErrorCode.INVALID_PACKAGE : err.code
				}));
				report.errors.push(...remappedErrors);
				report.warnings.push(...baseReport.warnings);
				return report;
			}

			const manifest = baseReport.manifest;
			report.warnings.push(...baseReport.warnings);

			// 3. Plugin ID egyezés ellenőrzése
			// Req 1.2: manifest.id !== pluginId → INVALID_MANIFEST
			if (manifest.id !== pluginId) {
				report.errors.push({
					code: PluginErrorCode.INVALID_MANIFEST,
					message: `Package plugin ID '${manifest.id}' does not match target plugin ID '${pluginId}'`,
					field: 'id'
				});
				return report;
			}

			// 4. Verzió összehasonlítás
			// Req 1.3: nem nagyobb verzió → VERSION_NOT_GREATER
			if (!isVersionGreater(manifest.version, installedVersion)) {
				report.errors.push({
					code: PluginErrorCode.VERSION_NOT_GREATER,
					message: `Incoming version '${manifest.version}' is not greater than installed version '${installedVersion}'`
				});
				return report;
			}

			// 5. Minden ellenőrzés átment
			// Req 1.5: valid = true, manifest visszaadva
			report.valid = true;
			report.manifest = manifest;
			return report;
		} catch (error) {
			// Váratlan hiba esetén INVALID_PACKAGE
			report.errors.push({
				code: PluginErrorCode.INVALID_PACKAGE,
				message: `Unexpected error during update validation: ${error instanceof Error ? error.message : String(error)}`
			});
			return report;
		}
	}

	/**
	 * Alap ZIP + manifest validáció, ID-egyediség ellenőrzése nélkül.
	 *
	 * A PluginValidator.validate() belső logikáját hívja, de a DUPLICATE_PLUGIN_ID
	 * hibakódot figyelmen kívül hagyja, mivel frissítésnél az ID már létezik.
	 */
	private async validateBasePackage(packagePath: string): Promise<ValidationReport> {
		// A meglévő PluginValidator tartalmaz ID-egyediség ellenőrzést is,
		// amelyet frissítésnél ki kell szűrni.
		const fullReport = await pluginValidator.validate(packagePath);

		// DUPLICATE_PLUGIN_ID hibákat eltávolítjuk — frissítésnél ez normális
		const filteredErrors = fullReport.errors.filter(
			(err) => err.code !== PluginErrorCode.DUPLICATE_PLUGIN_ID
		);

		return {
			...fullReport,
			valid: filteredErrors.length === 0,
			errors: filteredErrors
		};
	}
}

// ============================================================================
// PluginUpdater osztály
// ============================================================================

/**
 * Plugin frissítési logika kezelője.
 *
 * Kezeli a backup/rollback mechanizmust, a fájlcserét, az adatbázis-frissítést
 * és a migrációkat. A fő `update()` metódus a 6. feladatban kerül implementálásra.
 */
export class PluginUpdater {
	// -------------------------------------------------------------------------
	// 4.1 backupFiles — biztonsági mentés a frissítés előtt
	// -------------------------------------------------------------------------

	/**
	 * Plugin könyvtárának teljes biztonsági mentése a frissítés előtt.
	 *
	 * Másolatot készít a plugin fájlokról a PLUGIN_DIRS.BACKUPS könyvtárba.
	 * Hiba esetén a részleges backupot eltávolítja (fail-fast).
	 *
	 * @param pluginId - A frissítendő plugin azonosítója
	 * @returns BackupMeta objektum a visszaállításhoz szükséges adatokkal
	 * @throws Ha a plugin könyvtára nem létezik (PLUGIN_DIR_NOT_FOUND)
	 * @throws Ha a másolás sikertelen (részleges backup törölve)
	 *
	 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
	 */
	async backupFiles(pluginId: string): Promise<BackupMeta> {
		const pluginDir = getPluginDir(pluginId);

		// Req 3.6: Ha a plugin könyvtára nem létezik, PLUGIN_DIR_NOT_FOUND hibával visszatérünk
		if (!existsSync(pluginDir)) {
			throw new Error(`PLUGIN_DIR_NOT_FOUND: Plugin directory does not exist for '${pluginId}'`);
		}

		// Req 3.4: PLUGIN_DIRS.BACKUPS létrehozása ha nem létezik
		await ensureDir(PLUGIN_DIRS.BACKUPS);

		const timestamp = Date.now();
		const backupPath = getBackupPath(pluginId, timestamp);

		// Az aktuális verzió lekérése az adatbázisból (a BackupMeta-hoz szükséges)
		let version = '0.0.0';
		try {
			const records = await db
				.select({ pluginVersion: apps.pluginVersion })
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			if (records[0]?.pluginVersion) {
				version = records[0].pluginVersion;
			}
		} catch (error) {
			console.warn(`[PluginUpdater] Could not fetch version for backup meta: ${error}`);
			// Nem kritikus — a backup ettől még elvégezhető
		}

		// Req 3.1, 3.3: Atomi másolat készítése az eredeti könyvtár módosítása nélkül
		try {
			await copyDir(pluginDir, backupPath);
		} catch (copyError) {
			// Req 3.5: Ha a másolás sikertelen, a részleges backupot töröljük (fail-fast)
			try {
				await removeDir(backupPath);
			} catch (cleanupError) {
				console.error(
					`[PluginUpdater] Failed to clean up partial backup at '${backupPath}':`,
					cleanupError
				);
			}
			throw new Error(
				`Backup failed for plugin '${pluginId}': ${copyError instanceof Error ? copyError.message : String(copyError)}`
			);
		}

		// Req 3.2: BackupMeta objektum visszaadása
		const backupMeta: BackupMeta = {
			pluginId,
			backupPath,
			timestamp,
			version
		};

		console.log(
			`[PluginUpdater] Backup created for '${pluginId}' at '${backupPath}' (v${version})`
		);

		return backupMeta;
	}

	// -------------------------------------------------------------------------
	// 4.2 rollbackUpdate — visszaállítás a backup alapján
	// -------------------------------------------------------------------------

	/**
	 * Plugin visszaállítása a backup-ból sikertelen frissítés esetén.
	 *
	 * Törli a részlegesen frissített plugin könyvtárat, visszamásolja a backupot,
	 * majd visszaállítja az adatbázis verzió-mezőit.
	 * A backup könyvtárat megtartja a manuális vizsgálat lehetőségéhez.
	 *
	 * @param backupMeta - A backupFiles() által visszaadott BackupMeta objektum
	 * @param pluginId - A plugin azonosítója
	 * @param oldVersion - A visszaállítandó verzió
	 *
	 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
	 */
	async rollbackUpdate(
		backupMeta: BackupMeta,
		pluginId: string,
		oldVersion: string
	): Promise<void> {
		const pluginDir = getPluginDir(pluginId);

		console.log(`[PluginUpdater] Starting rollback for '${pluginId}' to v${oldVersion}`);

		try {
			// Req 7.2: Részlegesen frissített plugin könyvtár törlése
			await removeDir(pluginDir);

			// Req 7.2: Backup visszamásolása az eredeti helyre
			await copyDir(backupMeta.backupPath, pluginDir);

			// Req 7.3: Adatbázis mezők visszaállítása
			await db
				.update(apps)
				.set({
					pluginVersion: oldVersion,
					pluginUpdatedAt: null
				})
				.where(eq(apps.appId, pluginId));

			// Sikeres rollback naplózása (Req 7.7)
			await this.logEvent(pluginId, 'update_rollback', { pluginId, oldVersion });

			console.log(
				`[PluginUpdater] Rollback completed for '${pluginId}' (restored to v${oldVersion})`
			);
			// Req 7.4: A backup könyvtárat NEM töröljük — manuális vizsgálat lehetséges
		} catch (rollbackError) {
			// Req 7.5: Ha a fájlmásolás sikertelen → pluginStatus = 'error'
			console.error(`[PluginUpdater] Rollback failed for '${pluginId}':`, rollbackError);

			try {
				await db.update(apps).set({ pluginStatus: 'error' }).where(eq(apps.appId, pluginId));
			} catch (dbError) {
				console.error(`[PluginUpdater] Could not set error status for '${pluginId}':`, dbError);
			}

			// Req 7.5: update_rollback_failed bejegyzés a plugin_logs táblába
			await this.logEvent(pluginId, 'update_rollback_failed', {
				pluginId,
				error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
			});

			throw rollbackError;
		}
	}

	// -------------------------------------------------------------------------
	// 6.1 updateAppRegistry — app registry frissítése manifest alapján
	// -------------------------------------------------------------------------

	/**
	 * Az apps tábla frissítendő mezőinek frissítése a manifest alapján.
	 *
	 * A pluginInstalledAt és pluginStatus mezőket NEM módosítja.
	 * Ha egy manifest mező hiányzik, az adott mező null értékre kerül.
	 *
	 * @param manifest - A frissítési csomag validált manifest objektuma
	 *
	 * Requirements: 4.3, 4.5
	 */
	private async updateAppRegistry(manifest: PluginManifest): Promise<void> {
		// Név normalizálása — lokalizált vagy egyszerű string → LocalizedText
		const name =
			typeof manifest.name === 'string' ? { hu: manifest.name, en: manifest.name } : manifest.name;

		// Leírás normalizálása — lokalizált vagy egyszerű string → LocalizedText
		const description = manifest.description
			? typeof manifest.description === 'string'
				? { hu: manifest.description, en: manifest.description }
				: manifest.description
			: null;

		// Skaláris leírás (pluginDescription mezőhöz) — string formátum
		const pluginDescription = manifest.description
			? typeof manifest.description === 'string'
				? manifest.description
				: manifest.description.hu || manifest.description.en || null
			: null;

		try {
			await db
				.update(apps)
				.set({
					// App alap mezők
					version: manifest.version,
					name,
					description: description ?? undefined,
					icon: manifest.icon,
					iconStyle: manifest.iconStyle ?? null,
					author: manifest.author ?? null,
					keywords: manifest.keywords ?? null,
					updatedAt: new Date(),

					// Plugin-specifikus mezők
					pluginVersion: manifest.version,
					pluginAuthor: manifest.author ?? null,
					pluginDescription: pluginDescription,
					pluginPermissions: manifest.permissions ?? null,
					pluginDependencies: manifest.dependencies ?? null,
					pluginMinWebosVersion: manifest.minWebOSVersion ?? null,
					sidebarComponent: manifest.sidebarComponent ?? null,
					pluginUpdatedAt: new Date()

					// NEM frissítjük: pluginInstalledAt, pluginStatus
				})
				.where(eq(apps.appId, manifest.id));

			console.log(`[PluginUpdater] App registry updated for plugin: ${manifest.id}`);
		} catch (error) {
			throw new Error(
				`Failed to update app registry: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	// -------------------------------------------------------------------------
	// 6.4 update — fő frissítési metódus
	// -------------------------------------------------------------------------

	/**
	 * Plugin frissítése: fájlcsere, registry-frissítés, fordítások, email sablonok, migrációk.
	 *
	 * A folyamat lépései:
	 *   1. oldVersion lekérése az adatbázisból
	 *   2. backupFiles (fail-fast ha sikertelen)
	 *   3. try-catch: extractFiles → updateAppRegistry → importTranslations (ha van locale)
	 *      → importEmailTemplates (ha 'notifications') → runMigrations (ha 'database')
	 *   4. Sikeres: logEvent('update', ...), visszatér { success: true, ... }
	 *   5. Hiba: rollbackUpdate, logEvent('update_failed', ...), visszatér { success: false, ... }
	 *
	 * Az adatbázis-sémát (DROP SCHEMA CASCADE) soha nem hívja.
	 *
	 * @param packagePath - Érvényes plugin csomag ideiglenes fájl útvonala
	 * @param manifest - Validált manifest objektum
	 * @param pluginId - A frissítendő plugin azonosítója
	 * @returns UpdateResult (success, oldVersion, newVersion, error)
	 *
	 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1–5.5, 6.1–6.6, 7.6, 7.7
	 */
	async update(
		packagePath: string,
		manifest: PluginManifest,
		pluginId: string
	): Promise<UpdateResult> {
		const newVersion = manifest.version;

		// 1. Jelenlegi verzió lekérése az adatbázisból (rollback-hoz szükséges)
		let oldVersion = '0.0.0';
		try {
			const records = await db
				.select({ pluginVersion: apps.pluginVersion })
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			if (records[0]?.pluginVersion) {
				oldVersion = records[0].pluginVersion;
			}
		} catch (error) {
			console.error(`[PluginUpdater] Could not fetch current version for '${pluginId}':`, error);
			// Folytatjuk — a backup és rollback 0.0.0-val dolgozik
		}

		// 2. Fájlok biztonsági mentése (fail-fast: ha ez sikertelen, a frissítés le sem indul)
		let backupMeta: BackupMeta;
		try {
			backupMeta = await this.backupFiles(pluginId);
		} catch (backupError) {
			const errorMessage = backupError instanceof Error ? backupError.message : String(backupError);
			console.error(
				`[PluginUpdater] Backup failed for '${pluginId}', aborting update:`,
				backupError
			);
			await this.logEvent(pluginId, 'update_failed', { pluginId, error: errorMessage });
			return {
				success: false,
				oldVersion,
				newVersion,
				error: errorMessage
			};
		}

		// 3. Frissítési lépések try-catch blokkban
		try {
			// 3a. Fájlok kicsomagolása (PluginInstaller kompozíció útján)
			await pluginInstaller.extractFiles(packagePath, pluginId);

			// 3b. App registry frissítése
			await this.updateAppRegistry(manifest);

			// 3c. Fordítások frissítése (upsert — csak ha a manifest tartalmaz locale-okat)
			// Req 5.1, 5.3
			if (manifest.locales && manifest.locales.length > 0) {
				await pluginInstaller.importTranslations(pluginId, manifest.locales);
			}

			// 3d. Email sablonok frissítése (upsert — csak ha 'notifications' engedély van)
			// Req 5.2, 5.4
			if (manifest.permissions?.includes('notifications')) {
				await pluginInstaller.importEmailTemplates(pluginId);
			}

			// 3e. Inkrementális migrációk futtatása (csak ha 'database' engedély van)
			// Req 6.1, 6.4, 6.6
			if (manifest.permissions?.includes('database')) {
				const schemaName = pluginInstaller.sanitizeSchemaName(pluginId);
				await pluginInstaller.runMigrations(pluginId, schemaName);
			}

			// 4. Sikeres frissítés naplózása
			// Req 7.6, 10.1
			await this.logEvent(pluginId, 'update', { pluginId, oldVersion, newVersion });

			console.log(
				`[PluginUpdater] Successfully updated plugin '${pluginId}' from v${oldVersion} to v${newVersion}`
			);

			return { success: true, oldVersion, newVersion };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`[PluginUpdater] Update failed for '${pluginId}':`, error);

			// 5. Rollback indítása
			// Req 7.1
			try {
				await this.rollbackUpdate(backupMeta, pluginId, oldVersion);
			} catch (rollbackError) {
				// A rollbackUpdate már kezeli ezt az esetet (pluginStatus = 'error' + naplózás)
				console.error(`[PluginUpdater] Rollback also failed for '${pluginId}':`, rollbackError);
			}

			// Req 7.7, 10.2: update_failed naplózása
			await this.logEvent(pluginId, 'update_failed', { pluginId, error: errorMessage });

			return { success: false, oldVersion, newVersion, error: errorMessage };
		}
	}

	// -------------------------------------------------------------------------
	// logEvent — eseménynaplózás
	// -------------------------------------------------------------------------

	/**
	 * Esemény naplózása a plugin_logs táblába
	 */
	protected async logEvent(
		pluginId: string,
		eventType: string,
		eventData?: Record<string, unknown>
	): Promise<void> {
		try {
			await db.insert(pluginLogs).values({
				pluginId,
				eventType,
				eventData: eventData || null,
				userId: null
			});
		} catch (error) {
			console.error('[PluginUpdater] Failed to log event:', error);
			// Nem kritikus hiba
		}
	}
}

// ============================================================================
// Singleton exportok
// ============================================================================

export const pluginUpdateValidator = new PluginUpdateValidator();
export const pluginUpdater = new PluginUpdater();
