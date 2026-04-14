/**
 * Permission Repository
 *
 * A felhasználó jogosultságainak lekérése az adatbázisból.
 * A jogosultságok role-ok és group-ok alapján kerülnek összegyűjtésre.
 */
import db from '$lib/server/database';
import { eq, inArray, asc, desc, count } from 'drizzle-orm';
import {
	permissions,
	resources,
	rolePermissions,
	groupPermissions,
	userRoles,
	userGroups
} from '@racona/database/schemas';

/**
 * Egy jogosultság resource.permission formátumban.
 */
export interface UserPermission {
	/** Permission name (pl. "log.error.view") */
	permission: string;
	/** Resource name (pl. "log") */
	resource: string | null;
}

export interface PermissionListParams {
	limit: number;
	offset: number;
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

export interface PermissionWithResource {
	id: number;
	name: string;
	description: string | null;
	resourceId: number | null;
	resourceName: string | null;
	createdAt: Date | null;
}

export interface IPermissionRepository {
	findPermissionsForUser(userId: number): Promise<string[]>;
}

export class PermissionRepository implements IPermissionRepository {
	/**
	 * Lekéri a felhasználó összes jogosultságát (role + group alapján, deduplikálva).
	 *
	 * @param userId - A felhasználó ID-ja
	 * @returns A jogosultság nevek tömbje (pl. ["log.error.view", "log.activity.view"])
	 */
	async findPermissionsForUser(userId: number): Promise<string[]> {
		// 1. User role ID-k lekérése
		const userRoleRecords = await db
			.select({ roleId: userRoles.roleId })
			.from(userRoles)
			.where(eq(userRoles.userId, userId));
		const roleIds = userRoleRecords.map((r) => r.roleId).filter((id): id is number => id !== null);

		// 2. User group ID-k lekérése
		const userGroupRecords = await db
			.select({ groupId: userGroups.groupId })
			.from(userGroups)
			.where(eq(userGroups.userId, userId));
		const groupIds = userGroupRecords
			.map((g) => g.groupId)
			.filter((id): id is number => id !== null);

		// 3. Permission ID-k gyűjtése role-okból
		const rolePermissionIds: number[] = [];
		if (roleIds.length > 0) {
			const records = await db
				.select({ permissionId: rolePermissions.permissionId })
				.from(rolePermissions)
				.where(inArray(rolePermissions.roleId, roleIds));
			rolePermissionIds.push(
				...records.map((r) => r.permissionId).filter((id): id is number => id !== null)
			);
		}

		// 4. Permission ID-k gyűjtése group-okból
		const groupPermissionIds: number[] = [];
		if (groupIds.length > 0) {
			const records = await db
				.select({ permissionId: groupPermissions.permissionId })
				.from(groupPermissions)
				.where(inArray(groupPermissions.groupId, groupIds));
			groupPermissionIds.push(
				...records.map((r) => r.permissionId).filter((id): id is number => id !== null)
			);
		}

		// 5. Deduplikált permission ID-k
		const allPermissionIds = [...new Set([...rolePermissionIds, ...groupPermissionIds])];

		if (allPermissionIds.length === 0) {
			return [];
		}

		// 6. Permission nevek lekérése
		const permissionRecords = await db
			.select({ name: permissions.name })
			.from(permissions)
			.where(inArray(permissions.id, allPermissionIds));

		return permissionRecords.map((p) => p.name);
	}

	/**
	 * Jogosultságok lapozható lekérdezése az erőforrás nevével együtt (LEFT JOIN).
	 */
	async findManyWithResource(params: PermissionListParams): Promise<PermissionWithResource[]> {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;

		let orderByColumn;
		switch (params.sortBy) {
			case 'name':
				orderByColumn = permissions.name;
				break;
			case 'createdAt':
			default:
				orderByColumn = permissions.createdAt;
				break;
		}

		const rows = await db
			.select({
				id: permissions.id,
				name: permissions.name,
				description: permissions.description,
				resourceId: permissions.resourceId,
				resourceName: resources.name,
				createdAt: permissions.createdAt
			})
			.from(permissions)
			.leftJoin(resources, eq(permissions.resourceId, resources.id))
			.orderBy(sortDirection(orderByColumn))
			.limit(params.limit)
			.offset(params.offset);

		return rows;
	}

	/**
	 * Jogosultságok számának lekérdezése.
	 */
	async countAll(): Promise<number> {
		const [result] = await db.select({ count: count() }).from(permissions);

		return result?.count ?? 0;
	}
}

// Singleton instance
export const permissionRepository = new PermissionRepository();
