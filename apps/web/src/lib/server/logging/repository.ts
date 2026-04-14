import { and, eq, gte, lte, desc, asc, count, inArray, ilike } from 'drizzle-orm';
import db from '$lib/server/database';
import { errorLogs } from '@racona/database/schemas';
import type { LogLevel, LogEntry } from './types';

export interface LogFilters {
	level?: LogLevel | LogLevel[];
	source?: string;
	userId?: string;
	from?: Date;
	to?: Date;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface TimeRange {
	from?: Date;
	to?: Date;
}

export class LogRepository {
	async findMany(filters: LogFilters): Promise<LogEntry[]> {
		const conditions = [];

		if (filters.level) {
			if (Array.isArray(filters.level)) {
				if (filters.level.length > 0) {
					conditions.push(inArray(errorLogs.level, filters.level));
				}
			} else {
				conditions.push(eq(errorLogs.level, filters.level));
			}
		}
		if (filters.source) {
			conditions.push(ilike(errorLogs.source, `%${filters.source}%`));
		}
		if (filters.userId) {
			conditions.push(eq(errorLogs.userId, filters.userId));
		}
		if (filters.from) {
			conditions.push(gte(errorLogs.createdAt, filters.from));
		}
		if (filters.to) {
			conditions.push(lte(errorLogs.createdAt, filters.to));
		}

		// Determine sort column and order
		const sortColumn = filters.sortBy || 'timestamp';
		const sortDirection = filters.sortOrder === 'asc' ? asc : desc;

		let orderByColumn;
		switch (sortColumn) {
			case 'level':
				orderByColumn = errorLogs.level;
				break;
			case 'source':
				orderByColumn = errorLogs.source;
				break;
			case 'timestamp':
			default:
				orderByColumn = errorLogs.createdAt;
				break;
		}

		const rows = await db
			.select()
			.from(errorLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(sortDirection(orderByColumn))
			.limit(filters.limit ?? 100)
			.offset(filters.offset ?? 0);

		return rows.map((row) => ({
			id: String(row.id),
			level: String(row.level) as LogLevel,
			message: String(row.message),
			source: String(row.source),
			timestamp: row.createdAt?.toISOString() ?? new Date().toISOString(),
			stack: row.stack ? String(row.stack) : undefined,
			context: (row.context as Record<string, unknown>) ?? undefined,
			userId: row.userId ? String(row.userId) : undefined,
			url: row.url ? String(row.url) : undefined,
			method: row.method ? String(row.method) : undefined,
			routeId: row.routeId ? String(row.routeId) : undefined,
			userAgent: row.userAgent ? String(row.userAgent) : undefined
		}));
	}

	async count(filters: Omit<LogFilters, 'limit' | 'offset'>): Promise<number> {
		const conditions = [];

		if (filters.level) {
			if (Array.isArray(filters.level)) {
				if (filters.level.length > 0) {
					conditions.push(inArray(errorLogs.level, filters.level));
				}
			} else {
				conditions.push(eq(errorLogs.level, filters.level));
			}
		}
		if (filters.source) {
			conditions.push(ilike(errorLogs.source, `%${filters.source}%`));
		}
		if (filters.userId) {
			conditions.push(eq(errorLogs.userId, filters.userId));
		}
		if (filters.from) {
			conditions.push(gte(errorLogs.createdAt, filters.from));
		}
		if (filters.to) {
			conditions.push(lte(errorLogs.createdAt, filters.to));
		}

		const [result] = await db
			.select({ count: count() })
			.from(errorLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		return result?.count ?? 0;
	}

	async findById(id: string): Promise<LogEntry | null> {
		const [row] = await db.select().from(errorLogs).where(eq(errorLogs.id, id)).limit(1);

		if (!row) return null;

		return {
			id: String(row.id),
			level: String(row.level) as LogLevel,
			message: String(row.message),
			source: String(row.source),
			timestamp: row.createdAt?.toISOString() ?? new Date().toISOString(),
			stack: row.stack ? String(row.stack) : undefined,
			context: (row.context as Record<string, unknown>) ?? undefined,
			userId: row.userId ? String(row.userId) : undefined,
			url: row.url ? String(row.url) : undefined,
			method: row.method ? String(row.method) : undefined,
			routeId: row.routeId ? String(row.routeId) : undefined,
			userAgent: row.userAgent ? String(row.userAgent) : undefined
		};
	}

	async deleteById(id: string): Promise<boolean> {
		const result = await db.delete(errorLogs).where(eq(errorLogs.id, id));

		return (result.rowCount ?? 0) > 0;
	}

	async countByLevel(timeRange?: TimeRange): Promise<Record<LogLevel, number>> {
		const conditions = [];

		if (timeRange?.from) {
			conditions.push(gte(errorLogs.createdAt, timeRange.from));
		}
		if (timeRange?.to) {
			conditions.push(lte(errorLogs.createdAt, timeRange.to));
		}

		const rows = await db
			.select({
				level: errorLogs.level,
				count: count()
			})
			.from(errorLogs)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.groupBy(errorLogs.level);

		const result: Record<LogLevel, number> = {
			debug: 0,
			info: 0,
			warn: 0,
			error: 0,
			fatal: 0
		};

		for (const row of rows) {
			if (row.level in result) {
				result[row.level as LogLevel] = row.count;
			}
		}

		return result;
	}
}

export const logRepository = new LogRepository();
