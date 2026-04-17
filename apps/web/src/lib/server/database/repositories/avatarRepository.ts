import db from '$lib/server/database';
import { aiAvatars, userAvatarConfigs } from '@racona/database/schemas';
import type { AiAvatarSelectModel, UserAvatarConfigSelectModel } from '@racona/database/schemas';
import { eq } from 'drizzle-orm';

// Avatar konfiguráció mentési adatok típusa
export type UpsertAvatarConfigData = {
	avatarIdname: string;
	quality: 'sd' | 'hd';
	customName?: string | null;
};

// Új avatar rekord adatok típusa
export type InsertAvatarData = {
	idname: string;
	displayName: string;
	manifest: { descriptions: { hu: string; en: string } };
	availableQualities: ('sd' | 'hd')[];
};

export const avatarRepository = {
	/**
	 * Új avatar rekord beszúrása az adatbázisba
	 */
	async insertAvatar(data: InsertAvatarData): Promise<AiAvatarSelectModel> {
		const [created] = await db.insert(aiAvatars).values(data).returning();
		return created;
	},

	/**
	 * Avatar keresése idname alapján, null ha nem található
	 */
	async findAvatarByIdname(idname: string): Promise<AiAvatarSelectModel | null> {
		const [avatar] = await db.select().from(aiAvatars).where(eq(aiAvatars.idname, idname));
		return avatar ?? null;
	},

	/**
	 * Összes telepített avatar listázása
	 */
	async listAvatars(): Promise<AiAvatarSelectModel[]> {
		return db.select().from(aiAvatars);
	},

	/**
	 * Felhasználói avatar konfiguráció mentése (insert vagy update)
	 */
	async upsertUserAvatarConfig(
		userId: number,
		config: UpsertAvatarConfigData
	): Promise<UserAvatarConfigSelectModel> {
		const [result] = await db
			.insert(userAvatarConfigs)
			.values({ userId, ...config })
			.onConflictDoUpdate({
				target: userAvatarConfigs.userId,
				set: {
					avatarIdname: config.avatarIdname,
					quality: config.quality,
					customName: config.customName ?? null
				}
			})
			.returning();
		return result;
	},

	/**
	 * Felhasználói avatar konfiguráció lekérése.
	 * Ha nincs konfiguráció, automatikusan a "default" avatart adja vissza SD minőséggel.
	 */
	async getUserAvatarConfig(userId: number): Promise<UserAvatarConfigSelectModel | null> {
		const [config] = await db
			.select()
			.from(userAvatarConfigs)
			.where(eq(userAvatarConfigs.userId, userId));

		// Ha van mentett konfiguráció, azt adjuk vissza
		if (config) {
			return config;
		}

		// Ha nincs konfiguráció, ellenőrizzük hogy létezik-e a "default" avatar
		const defaultAvatar = await this.findAvatarByIdname('default');
		if (!defaultAvatar) {
			return null; // Nincs default avatar sem
		}

		// Visszaadjuk a default avatar konfigurációt (de nem mentjük el)
		return {
			id: 0, // Dummy ID, mivel ez nem mentett konfiguráció
			userId,
			avatarIdname: 'default',
			quality: 'sd' as const,
			customName: null
		};
	}
};
