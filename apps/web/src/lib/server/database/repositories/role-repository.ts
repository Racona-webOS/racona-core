import db from '$lib/server/database';
import { asc, desc, eq, notInArray, and, count } from 'drizzle-orm';
import {
	roles,
	userRoles,
	rolePermissions,
	permissions,
	users,
	roleAppAccess,
	apps
} from '@elyos/database/schemas';
import type { RoleSelectModel, UserSelectModel } from '@elyos/database/schemas';

interface RoleListParams {
	limit: number;
	offset: number;
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

interface CreateRoleData {
	name: { hu: string; en: string; [key: string]: string };
	description?: { hu?: string; en?: string; [key: string]: string | undefined } | null;
}

export interface RolePermissionRow {
	id: number;
	name: string;
	description: string | null;
	resourceId: number | null;
	createdAt: Date | null;
}

export interface RoleWithPermissions {
	role: RoleSelectModel;
	permissions: RolePermissionRow[];
	users: UserSelectModel[];
}

export interface RoleAppRow {
	id: number;
	appId: string;
	name: string | Record<string, string>;
	description: string | Record<string, string> | null;
	icon: string;
	category: string;
	createdAt: Date | null;
}

export class RoleRepository {
	/**
	 * Új szerepkör létrehozása.
	 */
	async create(data: CreateRoleData): Promise<RoleSelectModel> {
		const [role] = await db
			.insert(roles)
			.values({
				name: data.name,
				description: data.description ?? null
			})
			.returning();
		return role;
	}

	/**
	 * Szerepkör frissítése.
	 */
	async update(id: number, data: CreateRoleData): Promise<RoleSelectModel> {
		const [role] = await db
			.update(roles)
			.set({
				name: data.name,
				description: data.description ?? null,
				updatedAt: new Date()
			})
			.where(eq(roles.id, id))
			.returning();
		return role;
	}

	/**
	 * Összes szerepkör lekérdezése.
	 */
	async findAll(): Promise<RoleSelectModel[]> {
		return db.select().from(roles).orderBy(asc(roles.name));
	}

	/**
	 * Szerepkörök lekérdezése lapozással.
	 */
	async findManyPaginated(params: RoleListParams): Promise<RoleSelectModel[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;

		let orderByColumn;
		switch (params.sortBy) {
			case 'name':
				orderByColumn = roles.name;
				break;
			case 'createdAt':
			default:
				orderByColumn = roles.createdAt;
				break;
		}

		return db
			.select()
			.from(roles)
			.orderBy(sortDirection(orderByColumn))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Összes szerepkör számának lekérdezése.
	 */
	async countAll(): Promise<number> {
		const [result] = await db.select({ count: count() }).from(roles);
		return result?.count ?? 0;
	}

	/**
	 * Szerepkörök lekérdezése, amelyekhez a felhasználó még nem tartozik.
	 */
	async findRolesNotForUser(userId: number): Promise<RoleSelectModel[]> {
		const userRolesData = await db
			.select({ roleId: userRoles.roleId })
			.from(userRoles)
			.where(eq(userRoles.userId, userId));

		const roleIdsForUser = userRolesData
			.map((ur) => ur.roleId)
			.filter((id): id is number => id !== null);

		if (roleIdsForUser.length === 0) {
			return db.select().from(roles).orderBy(asc(roles.name));
		}

		return db
			.select()
			.from(roles)
			.where(notInArray(roles.id, roleIdsForUser))
			.orderBy(asc(roles.name));
	}

	/**
	 * Felhasználó hozzáadása szerepkörhöz.
	 */
	async addUserToRole(userId: number, roleId: number): Promise<void> {
		await db.insert(userRoles).values({ userId, roleId });
	}

	/**
	 * Felhasználó eltávolítása szerepkörből.
	 */
	async removeUserFromRole(userId: number, roleId: number): Promise<void> {
		await db
			.delete(userRoles)
			.where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
	}

	/**
	 * Szerepkör lekérdezése ID alapján.
	 */
	async findById(id: number): Promise<RoleSelectModel | null> {
		const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
		return role ?? null;
	}

	/**
	 * Szerepkör lekérdezése a hozzá tartozó jogosultságokkal és felhasználókkal.
	 */
	async findByIdWithPermissions(id: number): Promise<RoleWithPermissions | null> {
		const role = await this.findById(id);
		if (!role) return null;

		const [rolePerms, roleUsers] = await Promise.all([
			db
				.select({
					id: permissions.id,
					name: permissions.name,
					description: permissions.description,
					resourceId: permissions.resourceId,
					createdAt: permissions.createdAt
				})
				.from(rolePermissions)
				.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
				.where(eq(rolePermissions.roleId, id))
				.orderBy(asc(permissions.name)),
			db
				.select({
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
					deletedAt: users.deletedAt
				})
				.from(userRoles)
				.innerJoin(users, eq(userRoles.userId, users.id))
				.where(eq(userRoles.roleId, id))
				.orderBy(asc(users.name))
		]);

		return {
			role,
			permissions: rolePerms,
			users: roleUsers
		};
	}

	/**
	 * Jogosultságok lekérdezése, amelyek még nincsenek a szerepkörhöz rendelve.
	 */
	async findPermissionsNotForRole(roleId: number): Promise<RolePermissionRow[]> {
		const existingPerms = await db
			.select({ permissionId: rolePermissions.permissionId })
			.from(rolePermissions)
			.where(eq(rolePermissions.roleId, roleId));

		const existingPermIds = existingPerms
			.map((rp) => rp.permissionId)
			.filter((id): id is number => id !== null);

		if (existingPermIds.length === 0) {
			return db
				.select({
					id: permissions.id,
					name: permissions.name,
					description: permissions.description,
					resourceId: permissions.resourceId,
					createdAt: permissions.createdAt
				})
				.from(permissions)
				.orderBy(asc(permissions.name));
		}

		return db
			.select({
				id: permissions.id,
				name: permissions.name,
				description: permissions.description,
				resourceId: permissions.resourceId,
				createdAt: permissions.createdAt
			})
			.from(permissions)
			.where(notInArray(permissions.id, existingPermIds))
			.orderBy(asc(permissions.name));
	}

	/**
	 * Jogosultság hozzáadása szerepkörhöz.
	 */
	async addPermissionToRole(permissionId: number, roleId: number): Promise<void> {
		await db.insert(rolePermissions).values({ permissionId, roleId });
	}

	/**
	 * Jogosultság eltávolítása szerepkörből.
	 */
	async removePermissionFromRole(permissionId: number, roleId: number): Promise<void> {
		await db
			.delete(rolePermissions)
			.where(
				and(eq(rolePermissions.permissionId, permissionId), eq(rolePermissions.roleId, roleId))
			);
	}

	/**
	 * Szerepkörhöz tartozó jogosultságok lapozva.
	 */
	async findPermissionsForRolePaginated(
		roleId: number,
		params: RoleListParams
	): Promise<RolePermissionRow[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;
		const col = params.sortBy === 'name' ? permissions.name : permissions.createdAt;

		return db
			.select({
				id: permissions.id,
				name: permissions.name,
				description: permissions.description,
				resourceId: permissions.resourceId,
				createdAt: permissions.createdAt
			})
			.from(rolePermissions)
			.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
			.where(eq(rolePermissions.roleId, roleId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Szerepkörhöz tartozó jogosultságok száma.
	 */
	async countPermissionsForRole(roleId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(rolePermissions)
			.where(eq(rolePermissions.roleId, roleId));
		return result?.count ?? 0;
	}

	/**
	 * Szerepkörhöz tartozó felhasználók lapozva.
	 */
	async findUsersForRolePaginated(
		roleId: number,
		params: RoleListParams
	): Promise<UserSelectModel[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;
		const col = params.sortBy === 'name' ? users.name : users.createdAt;

		return db
			.select({
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
				deletedAt: users.deletedAt
			})
			.from(userRoles)
			.innerJoin(users, eq(userRoles.userId, users.id))
			.where(eq(userRoles.roleId, roleId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Szerepkörhöz tartozó felhasználók száma.
	 */
	async countUsersForRole(roleId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(userRoles)
			.where(eq(userRoles.roleId, roleId));
		return result?.count ?? 0;
	}

	/**
	 * Felhasználók lekérdezése, akik még nincsenek a szerepkörhöz rendelve.
	 */
	async findUsersNotInRole(roleId: number): Promise<UserSelectModel[]> {
		const usersInRole = await db
			.select({ userId: userRoles.userId })
			.from(userRoles)
			.where(eq(userRoles.roleId, roleId));

		const userIdsInRole = usersInRole
			.map((ur) => ur.userId)
			.filter((id): id is number => id !== null);

		if (userIdsInRole.length === 0) {
			return db.select().from(users).orderBy(asc(users.name));
		}

		return db
			.select()
			.from(users)
			.where(notInArray(users.id, userIdsInRole))
			.orderBy(asc(users.name));
	}

	/**
	 * Szerepkörhöz tartozó app-ok lapozva.
	 */
	async findAppsForRolePaginated(roleId: number, params: RoleListParams): Promise<RoleAppRow[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;
		const col = params.sortBy === 'name' ? apps.name : apps.createdAt;

		return db
			.select({
				id: apps.id,
				appId: apps.appId,
				name: apps.name,
				description: apps.description,
				icon: apps.icon,
				category: apps.category,
				createdAt: apps.createdAt
			})
			.from(roleAppAccess)
			.innerJoin(apps, eq(roleAppAccess.appId, apps.id))
			.where(eq(roleAppAccess.roleId, roleId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Szerepkörhöz tartozó app-ok száma.
	 */
	async countAppsForRole(roleId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(roleAppAccess)
			.where(eq(roleAppAccess.roleId, roleId));
		return result?.count ?? 0;
	}

	/**
	 * App-ok lekérdezése, amelyek még nincsenek a szerepkörhöz rendelve.
	 */
	async findAppsNotForRole(roleId: number): Promise<RoleAppRow[]> {
		const existingApps = await db
			.select({ appId: roleAppAccess.appId })
			.from(roleAppAccess)
			.where(eq(roleAppAccess.roleId, roleId));

		const existingAppIds = existingApps
			.map((ra) => ra.appId)
			.filter((id): id is number => id !== null);

		if (existingAppIds.length === 0) {
			return db
				.select({
					id: apps.id,
					appId: apps.appId,
					name: apps.name,
					description: apps.description,
					icon: apps.icon,
					category: apps.category,
					createdAt: apps.createdAt
				})
				.from(apps)
				.where(eq(apps.isActive, true))
				.orderBy(asc(apps.name));
		}

		return db
			.select({
				id: apps.id,
				appId: apps.appId,
				name: apps.name,
				description: apps.description,
				icon: apps.icon,
				category: apps.category,
				createdAt: apps.createdAt
			})
			.from(apps)
			.where(and(notInArray(apps.id, existingAppIds), eq(apps.isActive, true)))
			.orderBy(asc(apps.name));
	}

	/**
	 * App hozzáadása szerepkörhöz.
	 */
	async addAppToRole(appId: number, roleId: number): Promise<void> {
		await db.insert(roleAppAccess).values({ appId, roleId });
	}

	/**
	 * App eltávolítása szerepkörből.
	 */
	async removeAppFromRole(appId: number, roleId: number): Promise<void> {
		await db
			.delete(roleAppAccess)
			.where(and(eq(roleAppAccess.appId, appId), eq(roleAppAccess.roleId, roleId)));
	}

	/**
	 * Szerepkör törlése.
	 * A kapcsolódó sorok (user_roles, role_permissions, role_app_access)
	 * automatikusan törlődnek az ON DELETE CASCADE miatt.
	 */
	async delete(id: number): Promise<void> {
		await db.delete(roles).where(eq(roles.id, id));
	}
}

// Singleton instance
export const roleRepository = new RoleRepository();
