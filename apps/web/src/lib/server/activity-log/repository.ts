import { and, eq, gte, lte, desc, asc, count } from 'drizzle-orm';
import db from '$lib/server/database';
import { activityLogs, translations } from '@racona/database/schemas';
import type { ActivityEntry, ActivityLogFilters, ActivityLogInput } from './types';

export class ActivityLogRepository {
	async insert(input: ActivityLogInput): Promise<void> {
		await db.insert(activityLogs).values({
			actionKey: input.actionKey,
			userId: input.userId,
			resourceType: input.resourceType,
			resourceId: input.resourceId,
			context: input.context
		});
	}

	async findMany(filters: ActivityLogFilters, locale: string): Promise<ActivityEntry[]> {
		const conditions = this.buildConditions(filters);

		const sortColumn = filters.sortBy || 'createdAt';
		const sortDirection = filters.sortOrder === 'asc' ? asc : desc;

		let orderByColumn;
		switch (sortColumn) {
			case 'actionKey':
				orderByColumn = activityLogs.actionKey;
				break;
			case 'userId':
				orderByColumn = activityLogs.userId;
				break;
			case 'createdAt':
			default:
				orderByColumn = activityLogs.createdAt;
				break;
		}

		const rows = await db
			.select({
				id: activityLogs.id,
				actionKey: activityLogs.actionKey,
				userId: activityLogs.userId,
				resourceType: activityLogs.resourceType,
				resourceId: activityLogs.resourceId,
				context: activityLogs.context,
				createdAt: activityLogs.createdAt,
				translatedAction: translations.value
			})
			.from(activityLogs)
			.leftJoin(
				translations,
				and(
					eq(translations.namespace, 'activity'),
					eq(translations.key, activityLogs.actionKey),
					eq(translations.locale, locale)
				)
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(sortDirection(orderByColumn))
			.limit(filters.limit ?? 100)
			.offset(filters.offset ?? 0);

		return rows.map((row) => ({
			id: String(row.id),
			actionKey: String(row.actionKey),
			translatedAction: row.translatedAction ?? String(row.actionKey),
			userId: row.userId ?? undefined,
			resourceType: row.resourceType ?? undefined,
			resourceId: row.resourceId ?? undefined,
			context: (row.context as Record<string, unknown>) ?? undefined,
			createdAt: row.createdAt?.toISOString() ?? new Date().toISOString()
		}));
	}

	async count(filters: Omit<ActivityLogFilters, 'limit' | 'offset'>): Promise<number> {
		const conditions = this.buildConditions(filters);

		const [result] = await db
			.select({ count: count() })
			.from(activityLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		return result?.count ?? 0;
	}

	private buildConditions(
		filters: Omit<ActivityLogFilters, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
	) {
		const conditions = [];

		if (filters.userId) {
			conditions.push(eq(activityLogs.userId, filters.userId));
		}
		if (filters.actionKey) {
			conditions.push(eq(activityLogs.actionKey, filters.actionKey));
		}
		if (filters.from) {
			conditions.push(gte(activityLogs.createdAt, filters.from));
		}
		if (filters.to) {
			conditions.push(lte(activityLogs.createdAt, filters.to));
		}

		return conditions;
	}
}

export const activityLogRepository = new ActivityLogRepository();
