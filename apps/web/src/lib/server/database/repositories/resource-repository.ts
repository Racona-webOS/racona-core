import db from '$lib/server/database';
import { asc, desc, count } from 'drizzle-orm';
import { resources } from '@racona/database/schemas';

export interface ResourceListParams {
	limit: number;
	offset: number;
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

export class ResourceRepository {
	/**
	 * Erőforrások lapozható lekérdezése rendezéssel.
	 */
	async findManyPaginated(params: ResourceListParams) {
		const sortDirection = params.sortOrder === 'desc' ? desc : asc;

		let orderByColumn;
		switch (params.sortBy) {
			case 'name':
				orderByColumn = resources.name;
				break;
			case 'createdAt':
			default:
				orderByColumn = resources.createdAt;
				break;
		}

		return db
			.select()
			.from(resources)
			.orderBy(sortDirection(orderByColumn))
			.limit(params.limit)
			.offset(params.offset);
	}

	/**
	 * Erőforrások számának lekérdezése.
	 */
	async countAll(): Promise<number> {
		const [result] = await db.select({ count: count() }).from(resources);

		return result?.count ?? 0;
	}
}

// Singleton instance
export const resourceRepository = new ResourceRepository();
