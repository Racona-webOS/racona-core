import { command } from '$app/server';
import * as v from 'valibot';
import { groupRepository } from '$lib/server/database/repositories';
import { validatePaginationParams } from '$lib/server/utils/database';

const createGroupSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.optional(v.string()),
	locale: v.pipe(v.string(), v.minLength(2))
});

export const createGroup = command(createGroupSchema, async (input) => {
	try {
		const nameObj: Record<string, string> = { [input.locale]: input.name };
		const descObj: Record<string, string> | undefined = input.description
			? { [input.locale]: input.description }
			: undefined;

		const group = await groupRepository.create({ name: nameObj, description: descObj });
		return { success: true as const, data: group };
	} catch (error) {
		console.error('Error creating group:', error);
		return { success: false as const, error: 'Failed to create group' };
	}
});

const updateGroupSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1)),
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.optional(v.string()),
	locale: v.pipe(v.string(), v.minLength(2))
});

export const updateGroup = command(updateGroupSchema, async (input) => {
	try {
		const existing = await groupRepository.findById(input.groupId);
		if (!existing) {
			return { success: false as const, error: 'Group not found' };
		}

		const nameObj = {
			...(typeof existing.name === 'object' ? existing.name : {}),
			[input.locale]: input.name
		};

		const existingDesc =
			existing.description && typeof existing.description === 'object' ? existing.description : {};
		const descObj = input.description
			? { ...existingDesc, [input.locale]: input.description }
			: existingDesc && Object.keys(existingDesc).length > 0
				? existingDesc
				: undefined;

		const group = await groupRepository.update(input.groupId, {
			name: nameObj as Record<string, string>,
			description: descObj as Record<string, string> | undefined
		});
		return { success: true as const, data: group };
	} catch (error) {
		console.error('Error updating group:', error);
		return { success: false as const, error: 'Failed to update group' };
	}
});

const fetchGroupsSchema = v.object({
	page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
	pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
	sortBy: v.optional(v.string()),
	sortOrder: v.optional(v.picklist(['asc', 'desc']))
});

export type FetchGroupsInput = v.InferOutput<typeof fetchGroupsSchema>;

export const fetchGroups = command(fetchGroupsSchema, async (input) => {
	try {
		const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);

		const [rows, totalCount] = await Promise.all([
			groupRepository.findManyPaginated({
				limit,
				offset,
				sortBy: (input.sortBy as 'name' | 'createdAt') || 'createdAt',
				sortOrder: input.sortOrder || 'asc'
			}),
			groupRepository.countAll()
		]);

		return {
			success: true as const,
			data: rows,
			pagination: {
				page,
				pageSize: limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit)
			}
		};
	} catch (error) {
		console.error('Error fetching groups:', error);
		return {
			success: false as const,
			error: 'Failed to fetch groups',
			data: [],
			pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
		};
	}
});

const fetchGroupSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1))
});

export type FetchGroupInput = v.InferOutput<typeof fetchGroupSchema>;

export const fetchGroup = command(fetchGroupSchema, async (input) => {
	try {
		const group = await groupRepository.findById(input.groupId);
		if (!group) {
			return { success: false as const, error: 'Group not found' };
		}
		return { success: true as const, data: { group } };
	} catch (error) {
		console.error('Error fetching group:', error);
		return { success: false as const, error: 'Failed to fetch group' };
	}
});

const fetchGroupUsersSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1)),
	page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
	pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 10),
	sortBy: v.optional(v.string()),
	sortOrder: v.optional(v.picklist(['asc', 'desc']))
});

export const fetchGroupUsers = command(fetchGroupUsersSchema, async (input) => {
	try {
		const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);
		const [rows, totalCount] = await Promise.all([
			groupRepository.findUsersForGroupPaginated(input.groupId, {
				limit,
				offset,
				sortBy: (input.sortBy as 'name' | 'createdAt') || 'name',
				sortOrder: input.sortOrder || 'asc'
			}),
			groupRepository.countUsersForGroup(input.groupId)
		]);
		return {
			success: true as const,
			data: rows,
			pagination: { page, pageSize: limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
		};
	} catch (error) {
		console.error('Error fetching group users:', error);
		return {
			success: false as const,
			error: 'Failed to fetch group users',
			data: [],
			pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
		};
	}
});

const fetchGroupPermissionsSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1)),
	page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
	pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 10),
	sortBy: v.optional(v.string()),
	sortOrder: v.optional(v.picklist(['asc', 'desc']))
});

export const fetchGroupPermissions = command(fetchGroupPermissionsSchema, async (input) => {
	try {
		const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);
		const [rows, totalCount] = await Promise.all([
			groupRepository.findPermissionsForGroupPaginated(input.groupId, {
				limit,
				offset,
				sortBy: (input.sortBy as 'name' | 'createdAt') || 'name',
				sortOrder: input.sortOrder || 'asc'
			}),
			groupRepository.countPermissionsForGroup(input.groupId)
		]);
		return {
			success: true as const,
			data: rows,
			pagination: { page, pageSize: limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
		};
	} catch (error) {
		console.error('Error fetching group permissions:', error);
		return {
			success: false as const,
			error: 'Failed to fetch group permissions',
			data: [],
			pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
		};
	}
});

const addUserToGroupSchema = v.object({
	userId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export type AddUserToGroupInput = v.InferOutput<typeof addUserToGroupSchema>;

export const addUserToGroup = command(addUserToGroupSchema, async (input) => {
	try {
		await groupRepository.addUserToGroup(input.userId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error adding user to group:', error);
		return {
			success: false as const,
			error: 'Failed to add user to group'
		};
	}
});

const fetchAvailableUsersSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1))
});

export type FetchAvailableUsersInput = v.InferOutput<typeof fetchAvailableUsersSchema>;

export const fetchAvailableUsers = command(fetchAvailableUsersSchema, async (input) => {
	try {
		const availableUsers = await groupRepository.findUsersNotInGroup(input.groupId);

		return {
			success: true as const,
			data: availableUsers
		};
	} catch (error) {
		console.error('Error fetching available users:', error);
		return {
			success: false as const,
			error: 'Failed to fetch available users',
			data: []
		};
	}
});

const removeUserFromGroupSchema = v.object({
	userId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export type RemoveUserFromGroupInput = v.InferOutput<typeof removeUserFromGroupSchema>;

export const removeUserFromGroup = command(removeUserFromGroupSchema, async (input) => {
	try {
		await groupRepository.removeUserFromGroup(input.userId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error removing user from group:', error);
		return {
			success: false as const,
			error: 'Failed to remove user from group'
		};
	}
});

const fetchAvailablePermissionsForGroupSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const fetchAvailablePermissionsForGroup = command(
	fetchAvailablePermissionsForGroupSchema,
	async (input) => {
		try {
			const availablePermissions = await groupRepository.findPermissionsNotForGroup(input.groupId);

			return {
				success: true as const,
				data: availablePermissions
			};
		} catch (error) {
			console.error('Error fetching available permissions for group:', error);
			return {
				success: false as const,
				error: 'Failed to fetch available permissions',
				data: []
			};
		}
	}
);

const addPermissionToGroupSchema = v.object({
	permissionId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const addPermissionToGroup = command(addPermissionToGroupSchema, async (input) => {
	try {
		await groupRepository.addPermissionToGroup(input.permissionId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error adding permission to group:', error);
		return {
			success: false as const,
			error: 'Failed to add permission to group'
		};
	}
});

const removePermissionFromGroupSchema = v.object({
	permissionId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const removePermissionFromGroup = command(removePermissionFromGroupSchema, async (input) => {
	try {
		await groupRepository.removePermissionFromGroup(input.permissionId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error removing permission from group:', error);
		return {
			success: false as const,
			error: 'Failed to remove permission from group'
		};
	}
});

const deleteGroupSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const deleteGroup = command(deleteGroupSchema, async (input) => {
	try {
		await groupRepository.delete(input.groupId);
		return { success: true as const };
	} catch (error) {
		console.error('Error deleting group:', error);
		return { success: false as const, error: 'Failed to delete group' };
	}
});

// --- App kezelés ---

const fetchGroupAppsSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1)),
	page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
	pageSize: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 10),
	sortBy: v.optional(v.string()),
	sortOrder: v.optional(v.picklist(['asc', 'desc']))
});

export const fetchGroupApps = command(fetchGroupAppsSchema, async (input) => {
	try {
		const { page, limit, offset } = validatePaginationParams(input.page, input.pageSize);
		const [rows, totalCount] = await Promise.all([
			groupRepository.findAppsForGroupPaginated(input.groupId, {
				limit,
				offset,
				sortBy: (input.sortBy as 'name' | 'createdAt') || 'name',
				sortOrder: input.sortOrder || 'asc'
			}),
			groupRepository.countAppsForGroup(input.groupId)
		]);
		return {
			success: true as const,
			data: rows,
			pagination: { page, pageSize: limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
		};
	} catch (error) {
		console.error('Error fetching group apps:', error);
		return {
			success: false as const,
			error: 'Failed to fetch group apps',
			data: [],
			pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
		};
	}
});

const fetchAvailableAppsForGroupSchema = v.object({
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const fetchAvailableAppsForGroup = command(
	fetchAvailableAppsForGroupSchema,
	async (input) => {
		try {
			const availableApps = await groupRepository.findAppsNotForGroup(input.groupId);

			return {
				success: true as const,
				data: availableApps
			};
		} catch (error) {
			console.error('Error fetching available apps for group:', error);
			return {
				success: false as const,
				error: 'Failed to fetch available apps',
				data: []
			};
		}
	}
);

const addAppToGroupSchema = v.object({
	appId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const addAppToGroup = command(addAppToGroupSchema, async (input) => {
	try {
		await groupRepository.addAppToGroup(input.appId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error adding app to group:', error);
		return {
			success: false as const,
			error: 'Failed to add app to group'
		};
	}
});

const removeAppFromGroupSchema = v.object({
	appId: v.pipe(v.number(), v.minValue(1)),
	groupId: v.pipe(v.number(), v.minValue(1))
});

export const removeAppFromGroup = command(removeAppFromGroupSchema, async (input) => {
	try {
		await groupRepository.removeAppFromGroup(input.appId, input.groupId);

		return {
			success: true as const
		};
	} catch (error) {
		console.error('Error removing app from group:', error);
		return {
			success: false as const,
			error: 'Failed to remove app from group'
		};
	}
});
