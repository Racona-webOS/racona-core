import db from '$lib/server/database';
import {
	eq,
	and,
	ne,
	isNull,
	asc,
	desc,
	count,
	countDistinct,
	inArray,
	ilike,
	or
} from 'drizzle-orm';
import { users, accounts, userGroups, groups, userRoles, roles } from '@elyos/database/schemas';
import type { UserSettings } from '$lib/types/settings';
import { DEFAULT_USER_SETTINGS } from '$lib/types/settings';
import type { UserSelectModel, GroupSelectModel, RoleSelectModel } from '@elyos/database/schemas';

/**
 * Profil adatok típusa, amely tartalmazza az OAuth információkat is
 */
export interface ProfileData {
	id: number;
	name: string;
	email: string;
	username: string | null;
	image: string | null;
	createdAt: Date;
	oauthProvider: string | null;
	oauthImage: string | null;
}

/**
 * Profil frissítés bemeneti típusa
 */
export interface UserProfileUpdate {
	name?: string;
	username?: string | null;
	image?: string | null;
}

/**
 * Profil frissítés eredmény típusa
 */
export interface UpdateProfileResult {
	success: boolean;
	user?: {
		id: number;
		name: string;
		username: string | null;
		image: string | null;
	};
	error?: string;
}

export interface UserListParams {
	limit: number;
	offset: number;
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
	isActive?: boolean;
	providerId?: string[];
	search?: string;
}

export interface UserListItem {
	id: number;
	name: string;
	email: string;
	emailVerified: boolean | null;
	twoFactorEnabled: boolean | null;
	username: string | null;
	image: string | null;
	oauthImage: string | null;
	userSettings: unknown;
	createdAt: Date | null;
	updatedAt: Date | null;
	deletedAt: Date | null;
	isActive: boolean | null;
	providerId: string;
}

export interface UserWithGroupsAndRoles {
	user: UserSelectModel;
	groups: GroupSelectModel[];
	roles: RoleSelectModel[];
	isActive: boolean;
}

export class UserRepository {
	/**
	 * Felhasználó lekérdezése ID alapján.
	 * @param id - A felhasználó ID-ja.
	 * @returns A felhasználó adatokat tartalmazó objektum.
	 */
	async findById(id: number): Promise<UserSelectModel | undefined> {
		const result = await db.query.users.findFirst({
			where: eq(users.id, id)
		});
		return result;
	}

	/**
	 * Felhasználó lekérdezése csoportokkal és szerepkörökkel együtt.
	 * @param id - A felhasználó ID-ja.
	 * @returns A felhasználó a csoportjaival és szerepköreivel.
	 */
	async findByIdWithGroupsAndRoles(id: number): Promise<UserWithGroupsAndRoles | null> {
		const user = await this.findById(id);
		if (!user) return null;

		const [userGroupsData, userRolesData, accountData] = await Promise.all([
			db
				.select({
					id: groups.id,
					name: groups.name,
					description: groups.description,
					createdAt: groups.createdAt,
					updatedAt: groups.updatedAt
				})
				.from(userGroups)
				.innerJoin(groups, eq(userGroups.groupId, groups.id))
				.where(eq(userGroups.userId, id))
				.orderBy(asc(groups.name)),
			db
				.select({
					id: roles.id,
					name: roles.name,
					description: roles.description,
					createdAt: roles.createdAt,
					updatedAt: roles.updatedAt
				})
				.from(userRoles)
				.innerJoin(roles, eq(userRoles.roleId, roles.id))
				.where(eq(userRoles.userId, id))
				.orderBy(asc(roles.name)),
			db
				.select({ isActive: accounts.isActive })
				.from(accounts)
				.where(eq(accounts.userId, id))
				.limit(1)
		]);

		return {
			user,
			groups: userGroupsData,
			roles: userRolesData,
			isActive: accountData[0]?.isActive ?? true
		};
	}

	/**
	 * Felhasználó lekérdezése email alapján.
	 * @param email - Email cím.
	 * @returns A felhasználó adatokat tartalmazó objektum.
	 */
	async findByEmail(email: string): Promise<UserSelectModel | undefined> {
		const result = await db.query.users.findFirst({
			where: eq(users.email, email)
		});
		return result;
	}

	/**
	 * Felhasználói beállítások lekérdezése
	 * Ha nincs mentett beállítás, az alapértelmezett értékeket adja vissza
	 */
	async getUserSettings(userId: number): Promise<UserSettings> {
		const user = await this.findById(userId);

		if (!user || !user.userSettings) {
			return DEFAULT_USER_SETTINGS;
		}

		// Merge a mentett beállításokat az alapértelmezettekkel (ha hiányoznának mezők)
		return {
			...DEFAULT_USER_SETTINGS,
			...(user.userSettings as Partial<UserSettings>),
			background: {
				...DEFAULT_USER_SETTINGS.background,
				...((user.userSettings as Partial<UserSettings>)?.background || {})
			},
			theme: {
				...DEFAULT_USER_SETTINGS.theme,
				...((user.userSettings as Partial<UserSettings>)?.theme || {})
			},
			taskbar: {
				...DEFAULT_USER_SETTINGS.taskbar,
				...((user.userSettings as Partial<UserSettings>)?.taskbar || {}),
				itemVisibility: {
					...DEFAULT_USER_SETTINGS.taskbar.itemVisibility,
					...((user.userSettings as Partial<UserSettings>)?.taskbar?.itemVisibility || {})
				}
			},
			startMenu: {
				...DEFAULT_USER_SETTINGS.startMenu,
				...((user.userSettings as Partial<UserSettings>)?.startMenu || {})
			},
			desktop: {
				...DEFAULT_USER_SETTINGS.desktop,
				...((user.userSettings as Partial<UserSettings>)?.desktop || {})
			}
		};
	}

	/**
	 * Felhasználói beállítások mentése
	 */
	async updateUserSettings(
		userId: number,
		settings: UserSettings
	): Promise<{ success: boolean; settings: UserSettings }> {
		await db
			.update(users)
			.set({
				userSettings: settings,
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));

		return {
			success: true,
			settings
		};
	}

	/**
	 * Felhasználói beállítások részleges frissítése
	 */
	async patchUserSettings(
		userId: number,
		updates: Partial<UserSettings>
	): Promise<{ success: boolean; settings: UserSettings }> {
		// Először lekérjük a jelenlegi beállításokat
		const currentSettings = await this.getUserSettings(userId);

		// Merge az új beállításokkal
		const newSettings: UserSettings = {
			...currentSettings,
			...updates,
			background: {
				...currentSettings.background,
				...(updates.background || {})
			},
			theme: {
				...currentSettings.theme,
				...(updates.theme || {})
			},
			taskbar: {
				...currentSettings.taskbar,
				...(updates.taskbar || {}),
				itemVisibility: {
					...currentSettings.taskbar.itemVisibility,
					...(updates.taskbar?.itemVisibility || {})
				}
			},
			startMenu: {
				...currentSettings.startMenu,
				...(updates.startMenu || {})
			}
		};

		// preferPerformance logika
		if (updates.preferPerformance === true) {
			newSettings.windowPreview = false;
		}

		// windowPreview csak akkor frissíthető, ha preferPerformance false
		if (updates.windowPreview !== undefined && !newSettings.preferPerformance) {
			newSettings.windowPreview = updates.windowPreview;
		}

		// screenshotThumbnailHeight csak akkor frissíthető, ha windowPreview true
		if (updates.screenshotThumbnailHeight !== undefined) {
			if (newSettings.windowPreview && !newSettings.preferPerformance) {
				newSettings.screenshotThumbnailHeight = updates.screenshotThumbnailHeight;
			}
		}

		return this.updateUserSettings(userId, newSettings);
	}

	/**
	 * Összes felhasználó lekérdezése
	 */
	async findAll(): Promise<UserSelectModel[]> {
		return db.query.users.findMany();
	}

	/**
	 * Felhasználók lapozható lekérdezése rendezéssel.
	 * Csak az aktív (nem törölt) felhasználókat adja vissza.
	 */
	async findManyPaginated(params: UserListParams): Promise<UserListItem[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;

		let orderByColumn;
		switch (params.sortBy) {
			case 'name':
				orderByColumn = users.name;
				break;
			case 'createdAt':
			default:
				orderByColumn = users.createdAt;
				break;
		}

		const conditions = [isNull(users.deletedAt)];
		if (params.isActive !== undefined) {
			conditions.push(eq(accounts.isActive, params.isActive));
		}
		if (params.providerId && params.providerId.length > 0) {
			conditions.push(inArray(accounts.providerId, params.providerId));
		}
		if (params.search) {
			const pattern = `%${params.search}%`;
			conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
		}

		return db
			.selectDistinctOn([users.id], {
				id: users.id,
				name: users.name,
				email: users.email,
				emailVerified: users.emailVerified,
				twoFactorEnabled: users.twoFactorEnabled,
				username: users.username,
				image: users.image,
				oauthImage: users.oauthImage,
				userSettings: users.userSettings,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
				deletedAt: users.deletedAt,
				isActive: accounts.isActive,
				providerId: accounts.providerId
			})
			.from(users)
			.innerJoin(accounts, eq(accounts.userId, users.id))
			.where(and(...conditions))
			.orderBy(users.id, sortDirection(orderByColumn))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Aktív felhasználók számának lekérdezése (deletedAt IS NULL).
	 */
	async countAll(params?: {
		isActive?: boolean;
		providerId?: string[];
		search?: string;
	}): Promise<number> {
		const conditions = [isNull(users.deletedAt)];
		if (params?.isActive !== undefined) {
			conditions.push(eq(accounts.isActive, params.isActive));
		}
		if (params?.providerId && params.providerId.length > 0) {
			conditions.push(inArray(accounts.providerId, params.providerId));
		}
		if (params?.search) {
			const pattern = `%${params.search}%`;
			conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
		}

		const [result] = await db
			.select({ count: countDistinct(users.id) })
			.from(users)
			.innerJoin(accounts, eq(accounts.userId, users.id))
			.where(and(...conditions));

		return result?.count ?? 0;
	}

	/**
	 * Profil lekérdezése OAuth információkkal együtt.
	 * Join-olja a users és accounts táblákat, hogy megkapjuk az OAuth provider adatokat.
	 * @param userId - A felhasználó ID-ja.
	 * @returns ProfileData típus, amely tartalmazza az oauthProvider és oauthImage mezőket.
	 * _Requirements: 6.1_
	 */
	async getProfileWithOAuth(userId: number): Promise<ProfileData | null> {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			with: {
				accounts: true
			}
		});

		if (!user) {
			return null;
		}

		// Keressük meg az OAuth account-ot (nem credential provider)
		const oauthAccount = user.accounts?.find(
			(account) => account.providerId !== 'credential' && account.providerId !== null
		);

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			image: user.image,
			createdAt: user.createdAt ?? new Date(),
			oauthProvider: oauthAccount?.providerId ?? null,
			oauthImage: user.oauthImage ?? null
		};
	}

	/**
	 * Profil frissítése.
	 * Kezeli a name, username és image mezők frissítését.
	 * @param userId - A felhasználó ID-ja.
	 * @param data - A frissítendő adatok (UserProfileUpdate).
	 * @returns UpdateProfileResult típus.
	 * _Requirements: 2.4, 3.5, 7.2_
	 */
	async updateProfile(userId: number, data: UserProfileUpdate): Promise<UpdateProfileResult> {
		try {
			// Ellenőrizzük, hogy a felhasználó létezik-e
			const existingUser = await this.findById(userId);
			if (!existingUser) {
				return {
					success: false,
					error: 'Felhasználó nem található'
				};
			}

			// Ha van username és nem üres, ellenőrizzük az egyediséget
			if (data.username && data.username.trim() !== '') {
				const isAvailable = await this.isUsernameAvailable(data.username, userId);
				if (!isAvailable) {
					return {
						success: false,
						error: 'Ez a felhasználónév már foglalt'
					};
				}
			}

			// Készítsük elő a frissítendő mezőket
			const updateData: Partial<{
				name: string;
				username: string | null;
				image: string | null;
				updatedAt: Date;
			}> = {
				updatedAt: new Date()
			};

			if (data.name !== undefined) {
				updateData.name = data.name;
			}

			if (data.username !== undefined) {
				// Üres string esetén null-t mentünk
				updateData.username = data.username?.trim() === '' ? null : data.username;
			}

			if (data.image !== undefined) {
				updateData.image = data.image;
			}

			// Frissítés végrehajtása
			const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning({
				id: users.id,
				name: users.name,
				username: users.username,
				image: users.image
			});

			if (result.length === 0) {
				return {
					success: false,
					error: 'Nem sikerült frissíteni a profilt'
				};
			}

			return {
				success: true,
				user: result[0]
			};
		} catch (error) {
			console.error('Profile update error:', error);
			return {
				success: false,
				error: 'Hiba történt a profil frissítése során'
			};
		}
	}

	/**
	 * Felhasználónév egyediség ellenőrzése.
	 * Ellenőrzi, hogy a felhasználónév elérhető-e (kizárva a saját felhasználót).
	 * @param username - Az ellenőrizendő felhasználónév.
	 * @param excludeUserId - Opcionális: a kizárandó felhasználó ID-ja (saját felhasználó).
	 * @returns true, ha a felhasználónév elérhető, false ha foglalt.
	 * _Requirements: 4.6_
	 */
	async isUsernameAvailable(username: string, excludeUserId?: number): Promise<boolean> {
		// Üres vagy whitespace-only username mindig elérhető (nem foglalt)
		if (!username || username.trim() === '') {
			return true;
		}

		const normalizedUsername = username.trim();

		// Keressük meg, van-e már ilyen felhasználónév
		let existingUser: UserSelectModel | undefined;

		if (excludeUserId !== undefined) {
			// Ha van excludeUserId, akkor azt kizárjuk a keresésből
			existingUser = await db.query.users.findFirst({
				where: and(eq(users.username, normalizedUsername), ne(users.id, excludeUserId))
			});
		} else {
			// Ha nincs excludeUserId, egyszerű keresés
			existingUser = await db.query.users.findFirst({
				where: eq(users.username, normalizedUsername)
			});
		}

		// Ha nem találtunk ilyen felhasználót, a username elérhető
		return existingUser === undefined;
	}

	/**
	 * Felhasználó aktív státuszának beállítása.
	 * Az accounts tábla is_active mezőjét állítja.
	 * @param userId - A felhasználó ID-ja.
	 * @param isActive - Az új aktív státusz.
	 */
	async setUserActiveStatus(
		userId: number,
		isActive: boolean
	): Promise<{ success: boolean; error?: string }> {
		try {
			const result = await db
				.update(accounts)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(accounts.userId, userId));

			return { success: true };
		} catch (error) {
			console.error('Error setting user active status:', error);
			return { success: false, error: 'Failed to update user active status' };
		}
	}
}

// Singleton instance
export const userRepository = new UserRepository();
