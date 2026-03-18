/**
 * Plugin Installer
 *
 * Validált pluginok telepítésének kezelése.
 */

import type { InstallResult, PluginManifest } from '@elyos/database';
import { PluginErrorCode } from '@elyos/database';
import { getPluginDir, ensureDir, removeDir, safeWriteFile, copyDir } from '../utils/filesystem';
import { zipValidator } from '../validation/ZipValidator';
import db from '$lib/server/database';
import { apps, pluginLogs } from '@elyos/database';
import { eq } from 'drizzle-orm';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs/promises';

/**
 * Plugin Installer osztály
 *
 * Felelős a validált pluginok telepítéséért az összes szükséges lépéssel.
 */
export class PluginInstaller {
	/**
	 * Plugin telepítése
	 *
	 * @param packagePath - Validált plugin csomag útvonala
	 * @param manifest - Validált manifest objektum
	 * @returns Telepítési eredmény
	 */
	async install(packagePath: string, manifest: PluginManifest): Promise<InstallResult> {
		const pluginId = manifest.id;

		try {
			console.log(`[PluginInstaller] Starting installation of plugin: ${pluginId}`);

			// 1. Fájlok kicsomagolása
			await this.extractFiles(packagePath, pluginId);

			// 2. App registry regisztráció
			await this.registerInAppRegistry(manifest);

			// 3. Fordítások importálása
			if (manifest.locales && manifest.locales.length > 0) {
				await this.importTranslations(pluginId, manifest.locales);
			}

			// 4. Plugin séma létrehozása (csak ha a plugin igényli az adatbázist)
			if (manifest.permissions?.includes('database')) {
				await this.createPluginSchema(pluginId);
			}

			// 5. Esemény naplózása
			await this.logEvent(pluginId, 'install', {
				version: manifest.version,
				author: manifest.author
			});

			console.log(`[PluginInstaller] Successfully installed plugin: ${pluginId}`);

			return {
				success: true,
				pluginId
			};
		} catch (error) {
			console.error(`[PluginInstaller] Installation failed for ${pluginId}:`, error);

			// Rollback hiba esetén
			await this.rollback(pluginId);

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Installation failed'
			};
		}
	}

	/**
	 * Fájlok kicsomagolása a plugin tárolóba
	 *
	 * Task 3.1: Plugin Installer - Fájl Kicsomagolás
	 */
	async extractFiles(packagePath: string, pluginId: string): Promise<void> {
		const targetDir = getPluginDir(pluginId);

		try {
			// Célkönyvtár létrehozása
			await ensureDir(targetDir);

			// ZIP fájl betöltése
			const zip = new AdmZip(packagePath);

			// Fájlok kicsomagolása
			zip.extractAllTo(targetDir, true);

			// Jogosultságok beállítása (read/execute)
			await this.setPermissions(targetDir);

			console.log(`[PluginInstaller] Extracted files to: ${targetDir}`);
		} catch (error) {
			throw new Error(
				`Failed to extract files: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Fájl jogosultságok beállítása
	 */
	private async setPermissions(dirPath: string): Promise<void> {
		try {
			// Rekurzív jogosultság beállítás
			const entries = await fs.readdir(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name);

				if (entry.isDirectory()) {
					await fs.chmod(fullPath, 0o755); // rwxr-xr-x
					await this.setPermissions(fullPath);
				} else {
					// JavaScript fájlok futtathatók, egyéb fájlok csak olvashatók
					const isExecutable = entry.name.endsWith('.js') || entry.name.endsWith('.mjs');
					await fs.chmod(fullPath, isExecutable ? 0o755 : 0o644);
				}
			}
		} catch (error) {
			console.warn('[PluginInstaller] Failed to set permissions:', error);
			// Nem kritikus hiba, folytatjuk
		}
	}

	/**
	 * Plugin regisztrálása az app registry-ben
	 *
	 * Task 3.2: Plugin Installer - App Registry Regisztráció
	 */
	async registerInAppRegistry(manifest: PluginManifest): Promise<void> {
		try {
			// Ellenőrizzük, hogy már létezik-e
			const existing = await db
				.select({ id: apps.id })
				.from(apps)
				.where(eq(apps.appId, manifest.id))
				.limit(1);

			if (existing.length > 0) {
				throw new Error(`Plugin with ID '${manifest.id}' already exists in registry`);
			}

			// Név és leírás normalizálása
			const name =
				typeof manifest.name === 'string'
					? { hu: manifest.name, en: manifest.name }
					: manifest.name;

			const description = manifest.description
				? typeof manifest.description === 'string'
					? { hu: manifest.description, en: manifest.description }
					: manifest.description
				: undefined;

			// Új bejegyzés létrehozása
			await db.insert(apps).values({
				appId: manifest.id,
				name,
				description,
				version: manifest.version,
				icon: manifest.icon,
				iconStyle: manifest.iconStyle || 'cover', // Pluginok esetén alapértelmezett cover
				category: manifest.category || 'plugin',
				permissions: [], // App permissions (üres pluginoknak)
				multiInstance: manifest.multiInstance ?? false,
				defaultSize: manifest.defaultSize || { width: 800, height: 600 },
				minSize: manifest.minSize || { width: 400, height: 300 },
				maxSize: manifest.maxSize || undefined,
				author: manifest.author,
				keywords: manifest.keywords || [],
				isActive: true,
				isPublic: manifest.isPublic ?? false,
				sortOrder: manifest.sortOrder ?? 999,

				// Plugin-specifikus mezők
				appType: 'plugin',
				pluginVersion: manifest.version,
				pluginAuthor: manifest.author,
				pluginDescription:
					typeof manifest.description === 'string'
						? manifest.description
						: manifest.description?.hu || manifest.description?.en,
				pluginPermissions: manifest.permissions,
				pluginDependencies: manifest.dependencies || {},
				pluginMinWebosVersion: manifest.minWebOSVersion,
				pluginStatus: 'active',
				pluginInstalledAt: new Date(),
				pluginUpdatedAt: null
			});

			console.log(`[PluginInstaller] Registered plugin in app registry: ${manifest.id}`);
		} catch (error) {
			throw new Error(
				`Failed to register in app registry: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Fordítások importálása
	 *
	 * Task 3.3: Plugin Installer - Fordítások Importálása
	 */
	async importTranslations(pluginId: string, locales: string[]): Promise<void> {
		try {
			const pluginDir = getPluginDir(pluginId);
			const localesDir = path.join(pluginDir, 'locales');

			// Ellenőrizzük, hogy létezik-e a locales könyvtár
			try {
				await fs.access(localesDir);
			} catch {
				console.warn(`[PluginInstaller] Locales directory not found for plugin: ${pluginId}`);
				return;
			}

			// Minden locale fájl beolvasása és importálása
			for (const locale of locales) {
				const localeFile = path.join(localesDir, `${locale}.json`);

				try {
					const content = await fs.readFile(localeFile, 'utf-8');
					const translations = JSON.parse(content);

					// Fordítások importálása prefixelt kulcsokkal
					await this.importLocaleTranslations(pluginId, locale, translations);

					console.log(`[PluginInstaller] Imported translations for locale: ${locale}`);
				} catch (error) {
					console.warn(`[PluginInstaller] Failed to import locale ${locale}:`, error);
					// Nem kritikus hiba, folytatjuk a többi locale-lal
				}
			}
		} catch (error) {
			throw new Error(
				`Failed to import translations: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Egyedi locale fordításainak importálása
	 */
	private async importLocaleTranslations(
		pluginId: string,
		locale: string,
		translations: Record<string, string>
	): Promise<void> {
		const { translations: translationsTable } = await import('@elyos/database');

		// Flatten nested translations
		const flatTranslations = this.flattenTranslations(translations);

		// Batch insert
		const values = Object.entries(flatTranslations).map(([key, value]) => ({
			namespace: `plugin:${pluginId}`,
			key,
			locale,
			value
		}));

		if (values.length > 0) {
			await db
				.insert(translationsTable)
				.values(values)
				.onConflictDoUpdate({
					target: [translationsTable.namespace, translationsTable.key, translationsTable.locale],
					set: { value: db.sql`excluded.value`, updatedAt: new Date() }
				});
		}
	}

	/**
	 * Nested objektum flatten-elése
	 */
	private flattenTranslations(
		obj: Record<string, unknown>,
		prefix: string = ''
	): Record<string, string> {
		const result: Record<string, string> = {};

		for (const [key, value] of Object.entries(obj)) {
			const newKey = prefix ? `${prefix}.${key}` : key;

			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				Object.assign(result, this.flattenTranslations(value as Record<string, unknown>, newKey));
			} else {
				result[newKey] = String(value);
			}
		}

		return result;
	}

	/**
	 * Plugin adatbázis séma létrehozása és migrációk futtatása
	 *
	 * Task 3.4: Plugin Installer - Séma Létrehozás
	 */
	async createPluginSchema(pluginId: string): Promise<void> {
		try {
			const schemaName = this.sanitizeSchemaName(pluginId);

			// Séma létrehozása
			await db.execute(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

			// Alapértelmezett kv_store tábla
			await db.execute(`
				CREATE TABLE IF NOT EXISTS ${schemaName}.kv_store (
					key VARCHAR(255) PRIMARY KEY,
					value JSONB NOT NULL,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`);

			// Migrációk nyilvántartó táblája
			await db.execute(`
				CREATE TABLE IF NOT EXISTS ${schemaName}.migrations (
					id SERIAL PRIMARY KEY,
					filename VARCHAR(255) NOT NULL UNIQUE,
					applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`);

			// Plugin migrations/ mappájának futtatása
			await this.runMigrations(pluginId, schemaName);

			console.log(`[PluginInstaller] Created plugin schema: ${schemaName}`);
		} catch (error) {
			throw new Error(
				`Failed to create plugin schema: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Plugin migrációs SQL fájlok futtatása sorrendben.
	 * Csak azokat futtatja, amelyek még nem szerepelnek a migrations táblában.
	 */
	private async runMigrations(pluginId: string, schemaName: string): Promise<void> {
		const pluginDir = getPluginDir(pluginId);
		const migrationsDir = path.join(pluginDir, 'migrations');

		try {
			await fs.access(migrationsDir);
		} catch {
			// Nincs migrations/ mappa — nem kötelező
			return;
		}

		// SQL fájlok beolvasása, névsorrendben (001_, 002_, ...)
		const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

		if (files.length === 0) return;

		// Már lefutott migrációk lekérése
		const applied = await db.execute(`SELECT filename FROM ${schemaName}.migrations`);
		const appliedSet = new Set(
			(applied.rows as Array<{ filename: string }>).map((r) => r.filename)
		);

		for (const file of files) {
			if (appliedSet.has(file)) {
				console.log(`[PluginInstaller] Migration already applied, skipping: ${file}`);
				continue;
			}

			const sqlPath = path.join(migrationsDir, file);

			// Fájl beolvasása — ha nem olvasható, telepítés sikertelen
			let sqlContent: string;
			try {
				sqlContent = await fs.readFile(sqlPath, 'utf-8');
			} catch (err) {
				throw new Error(
					`Migration fájl nem olvasható: ${file} — ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`
				);
			}

			// Üres fájl ellenőrzés
			if (!sqlContent.trim()) {
				throw new Error(`Migration fájl üres: ${file}`);
			}

			// Táblaneveket automatikusan prefixeljük a plugin sémával,
			// ha még nincs séma prefix a lekérdezésben
			const prefixedSql = this.prefixMigrationSchema(sqlContent, schemaName);

			console.log(`[PluginInstaller] Running migration: ${file}`);

			// SQL végrehajtása — szintaktikai vagy egyéb DB hiba esetén telepítés sikertelen
			try {
				await db.execute(prefixedSql);
			} catch (err) {
				throw new Error(
					`Migration sikertelen: ${file} — ${err instanceof Error ? err.message : 'Ismeretlen adatbázis hiba'}`
				);
			}

			// Migrációt feljegyezzük
			await db.execute(`INSERT INTO ${schemaName}.migrations (filename) VALUES ('${file}')`);

			console.log(`[PluginInstaller] Migration applied: ${file}`);
		}
	}

	/**
	 * Migrációs SQL-ben a táblaneveket a plugin sémával prefixeli,
	 * ha még nincs séma megadva (pl. CREATE TABLE notes → CREATE TABLE plugin_x.notes).
	 */
	private prefixMigrationSchema(sql: string, schemaName: string): string {
		// Ha már tartalmaz séma prefixet, nem módosítjuk
		if (sql.toLowerCase().includes(schemaName.toLowerCase() + '.')) {
			return sql;
		}
		return sql
			.replace(
				/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z_][a-z0-9_]*)/gi,
				`CREATE TABLE IF NOT EXISTS ${schemaName}.$1`
			)
			.replace(/CREATE\s+TABLE\s+([a-z_][a-z0-9_]*)/gi, `CREATE TABLE ${schemaName}.$1`)
			.replace(
				/CREATE\s+INDEX\s+([a-z_][a-z0-9_]*)\s+ON\s+([a-z_][a-z0-9_]*)/gi,
				`CREATE INDEX $1 ON ${schemaName}.$2`
			)
			.replace(
				/CREATE\s+UNIQUE\s+INDEX\s+([a-z_][a-z0-9_]*)\s+ON\s+([a-z_][a-z0-9_]*)/gi,
				`CREATE UNIQUE INDEX $1 ON ${schemaName}.$2`
			);
	}

	/**
	 * Séma név sanitizálása (SQL injection védelem)
	 *
	 * PostgreSQL séma nevekben nem lehet kötőjel, ezért aláhúzásra cseréljük.
	 */
	private sanitizeSchemaName(pluginId: string): string {
		// Kötőjeleket aláhúzásra cseréljük, minden mást eltávolítunk
		const sanitized = pluginId.replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
		return `plugin_${sanitized}`;
	}

	/**
	 * Esemény naplózása
	 */
	private async logEvent(
		pluginId: string,
		eventType: string,
		eventData?: Record<string, unknown>,
		userId?: string
	): Promise<void> {
		try {
			await db.insert(pluginLogs).values({
				pluginId,
				eventType,
				eventData: eventData || null,
				userId: userId || null
			});
		} catch (error) {
			console.error('[PluginInstaller] Failed to log event:', error);
			// Nem kritikus hiba
		}
	}

	/**
	 * Telepítés visszavonása hiba esetén
	 *
	 * Task 3.5: Plugin Installer - Rollback Mechanizmus
	 */
	async rollback(pluginId: string): Promise<void> {
		console.log(`[PluginInstaller] Rolling back installation for: ${pluginId}`);

		try {
			// 1. Fájlok törlése
			const pluginDir = getPluginDir(pluginId);
			await removeDir(pluginDir);
			console.log(`[PluginInstaller] Removed plugin files`);

			// 2. App registry bejegyzés törlése
			await db.delete(apps).where(eq(apps.appId, pluginId));
			console.log(`[PluginInstaller] Removed app registry entry`);

			// 3. Fordítások törlése
			const { translations: translationsTable } = await import('@elyos/database');
			await db
				.delete(translationsTable)
				.where(eq(translationsTable.namespace, `plugin:${pluginId}`));
			console.log(`[PluginInstaller] Removed translations`);

			// 4. Plugin séma törlése
			const schemaName = this.sanitizeSchemaName(pluginId);
			await db.execute(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
			console.log(`[PluginInstaller] Removed plugin schema`);

			// 5. Rollback esemény naplózása
			await this.logEvent(pluginId, 'installation_rollback', {
				reason: 'Installation failed'
			});

			console.log(`[PluginInstaller] Rollback completed for: ${pluginId}`);
		} catch (error) {
			console.error(`[PluginInstaller] Rollback failed for ${pluginId}:`, error);
			// Kritikus hiba - naplózzuk
			await this.logEvent(pluginId, 'rollback_failed', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
}

/**
 * Singleton instance
 */
export const pluginInstaller = new PluginInstaller();
