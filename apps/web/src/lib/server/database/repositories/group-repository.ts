import db from '$lib/server/database';
import { asc, desc, count, eq, notInArray, and } from 'drizzle-orm';
import {
	groups,
	userGroups,
	users,
	groupPermissions,
	permissions,
	groupAppAccess,
	apps
} from '@racona/database/schemas';
import type { GroupSelectModel, UserSelectModel } from '@racona/database/schemas';

export interface GroupListParams {
	limit: number;
	offset: number;
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

export interface GroupWithUsers {
	group: GroupSelectModel;
	users: UserSelectModel[];
}

export interface GroupPermissionRow {
	id: number;
	name: string;
	description: string | null;
	resourceId: number | null;
	createdAt: Date | null;
}

export interface GroupWithUsersAndPermissions {
	group: GroupSelectModel;
	users: UserSelectModel[];
	permissions: GroupPermissionRow[];
}

export interface GroupAppRow {
	id: number;
	appId: string;
	name: string | Record<string, string>;
	description: string | Record<string, string> | null;
	icon: string;
	category: string;
	createdAt: Date | null;
}

export class GroupRepository {
	/**
	 * Új csoport létrehozása.
	 */
	async create(data: {
		name: Record<string, string>;
		description?: Record<string, string>;
	}): Promise<GroupSelectModel> {
		const [group] = await db
			.insert(groups)
			.values({
				name: data.name as any,
				description: (data.description ?? null) as any
			})
			.returning();
		return group;
	}

	/**
	 * Csoport frissítése.
	 */
	async update(
		id: number,
		data: { name: Record<string, string>; description?: Record<string, string> | null }
	): Promise<GroupSelectModel> {
		const [group] = await db
			.update(groups)
			.set({
				name: data.name as any,
				description: (data.description ?? null) as any,
				updatedAt: new Date()
			})
			.where(eq(groups.id, id))
			.returning();
		return group;
	}

	/**
	 * Csoportok lapozható lekérdezése rendezéssel.
	 */
	async findManyPaginated(params: GroupListParams): Promise<GroupSelectModel[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;

		let orderByColumn;
		switch (params.sortBy) {
			case 'name':
				orderByColumn = groups.name;
				break;
			case 'createdAt':
			default:
				orderByColumn = groups.createdAt;
				break;
		}

		return db
			.select()
			.from(groups)
			.orderBy(sortDirection(orderByColumn))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Csoportok számának lekérdezése.
	 */
	async countAll(): Promise<number> {
		const [result] = await db.select({ count: count() }).from(groups);

		return result?.count ?? 0;
	}

	/**
	 * Csoport lekérdezése ID alapján.
	 */
	async findById(id: number): Promise<GroupSelectModel | null> {
		const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		return group ?? null;
	}

	/**
	 * Csoport lekérdezése a hozzá tartozó felhasználókkal és jogosultságokkal.
	 */
	async findByIdWithUsers(id: number): Promise<GroupWithUsersAndPermissions | null> {
		const group = await this.findById(id);
		if (!group) return null;

		const [groupUsers, groupPerms] = await Promise.all([
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
				.from(userGroups)
				.innerJoin(users, eq(userGroups.userId, users.id))
				.where(eq(userGroups.groupId, id))
				.orderBy(asc(users.name)),
			db
				.select({
					id: permissions.id,
					name: permissions.name,
					description: permissions.description,
					resourceId: permissions.resourceId,
					createdAt: permissions.createdAt
				})
				.from(groupPermissions)
				.innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
				.where(eq(groupPermissions.groupId, id))
				.orderBy(asc(permissions.name))
		]);

		return {
			group,
			users: groupUsers,
			permissions: groupPerms
		};
	}

	/**
	 * Csoporthoz tartozó felhasználók lapozva.
	 */
	async findUsersForGroupPaginated(
		groupId: number,
		params: GroupListParams
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
			.from(userGroups)
			.innerJoin(users, eq(userGroups.userId, users.id))
			.where(eq(userGroups.groupId, groupId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Csoporthoz tartozó felhasználók száma.
	 */
	async countUsersForGroup(groupId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(userGroups)
			.where(eq(userGroups.groupId, groupId));
		return result?.count ?? 0;
	}

	/**
	 * Csoporthoz tartozó jogosultságok lapozva.
	 */
	async findPermissionsForGroupPaginated(
		groupId: number,
		params: GroupListParams
	): Promise<GroupPermissionRow[]> {
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
			.from(groupPermissions)
			.innerJoin(permissions, eq(groupPermissions.permissionId, permissions.id))
			.where(eq(groupPermissions.groupId, groupId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Csoporthoz tartozó jogosultságok száma.
	 */
	async countPermissionsForGroup(groupId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(groupPermissions)
			.where(eq(groupPermissions.groupId, groupId));
		return result?.count ?? 0;
	}

	/**
	 * Felhasználó hozzáadása csoporthoz.
	 */
	async addUserToGroup(userId: number, groupId: number): Promise<void> {
		await db.insert(userGroups).values({ userId, groupId });
	}

	/**
	 * Felhasználó eltávolítása csoportból.
	 */
	async removeUserFromGroup(userId: number, groupId: number): Promise<void> {
		await db
			.delete(userGroups)
			.where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId)));
	}

	/**
	 * Felhasználók lekérdezése, akik még nincsenek a csoportban.
	 */
	async findUsersNotInGroup(groupId: number): Promise<UserSelectModel[]> {
		const usersInGroup = await db
			.select({ userId: userGroups.userId })
			.from(userGroups)
			.where(eq(userGroups.groupId, groupId));

		const userIdsInGroup = usersInGroup
			.map((ug) => ug.userId)
			.filter((id): id is number => id !== null);

		if (userIdsInGroup.length === 0) {
			return db.select().from(users).orderBy(asc(users.name));
		}

		return db
			.select()
			.from(users)
			.where(notInArray(users.id, userIdsInGroup))
			.orderBy(asc(users.name));
	}

	/**
	 * Összes csoport lekérdezése.
	 */
	async findAll(): Promise<GroupSelectModel[]> {
		return db.select().from(groups).orderBy(asc(groups.name));
	}

	/**
	 * Csoportok lekérdezése, amelyekhez a felhasználó még nem tartozik.
	 */
	async findGroupsNotForUser(userId: number): Promise<GroupSelectModel[]> {
		const userGroupsData = await db
			.select({ groupId: userGroups.groupId })
			.from(userGroups)
			.where(eq(userGroups.userId, userId));

		const groupIdsForUser = userGroupsData
			.map((ug) => ug.groupId)
			.filter((id): id is number => id !== null);

		if (groupIdsForUser.length === 0) {
			return db.select().from(groups).orderBy(asc(groups.name));
		}

		return db
			.select()
			.from(groups)
			.where(notInArray(groups.id, groupIdsForUser))
			.orderBy(asc(groups.name));
	}

	/**
	 * Jogosultságok lekérdezése, amelyek még nincsenek a csoporthoz rendelve.
	 */
	async findPermissionsNotForGroup(groupId: number): Promise<GroupPermissionRow[]> {
		const existingPerms = await db
			.select({ permissionId: groupPermissions.permissionId })
			.from(groupPermissions)
			.where(eq(groupPermissions.groupId, groupId));

		const existingPermIds = existingPerms
			.map((gp) => gp.permissionId)
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
	 * Jogosultság hozzáadása csoporthoz.
	 */
	async addPermissionToGroup(permissionId: number, groupId: number): Promise<void> {
		await db.insert(groupPermissions).values({ permissionId, groupId });
	}

	/**
	 * Jogosultság eltávolítása csoportból.
	 */
	async removePermissionFromGroup(permissionId: number, groupId: number): Promise<void> {
		await db
			.delete(groupPermissions)
			.where(
				and(eq(groupPermissions.permissionId, permissionId), eq(groupPermissions.groupId, groupId))
			);
	}

	/**
	 * Csoporthoz tartozó app-ok lapozva.
	 */
	async findAppsForGroupPaginated(
		groupId: number,
		params: GroupListParams
	): Promise<GroupAppRow[]> {
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
			.from(groupAppAccess)
			.innerJoin(apps, eq(groupAppAccess.appId, apps.id))
			.where(eq(groupAppAccess.groupId, groupId))
			.orderBy(sortDirection(col))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Csoporthoz tartozó app-ok száma.
	 */
	async countAppsForGroup(groupId: number): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(groupAppAccess)
			.where(eq(groupAppAccess.groupId, groupId));
		return result?.count ?? 0;
	}

	/**
	 * App-ok lekérdezése, amelyek még nincsenek a csoporthoz rendelve.
	 */
	async findAppsNotForGroup(groupId: number): Promise<GroupAppRow[]> {
		const existingApps = await db
			.select({ appId: groupAppAccess.appId })
			.from(groupAppAccess)
			.where(eq(groupAppAccess.groupId, groupId));

		const existingAppIds = existingApps
			.map((ga) => ga.appId)
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
	 * App hozzáadása csoporthoz.
	 */
	async addAppToGroup(appId: number, groupId: number): Promise<void> {
		await db.insert(groupAppAccess).values({ appId, groupId });
	}

	/**
	 * App eltávolítása csoportból.
	 */
	async removeAppFromGroup(appId: number, groupId: number): Promise<void> {
		await db
			.delete(groupAppAccess)
			.where(and(eq(groupAppAccess.appId, appId), eq(groupAppAccess.groupId, groupId)));
	}

	/**
	 * Csoport törlése.
	 * A kapcsolódó sorok (user_groups, group_permissions, group_app_access)
	 * automatikusan törlődnek az ON DELETE CASCADE miatt.
	 */
	async delete(id: number): Promise<void> {
		await db.delete(groups).where(eq(groups.id, id));
	}
}

// Singleton instance
export const groupRepository = new GroupRepository();
