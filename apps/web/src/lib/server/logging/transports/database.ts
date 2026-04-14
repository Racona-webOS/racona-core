import db from '$lib/server/database';
import { errorLogs } from '@racona/database/schemas';
import type { LogEntry, LogTransport } from '../types';

export class DatabaseTransport implements LogTransport {
	name = 'database';

	async write(entry: LogEntry): Promise<void> {
		try {
			await db.insert(errorLogs).values({
				id: entry.id,
				level: entry.level,
				message: entry.message,
				source: entry.source,
				stack: entry.stack ?? null,
				context: entry.context ?? null,
				userId: entry.userId ?? null,
				url: entry.url ?? null,
				method: entry.method ?? null,
				routeId: entry.routeId ?? null,
				userAgent: entry.userAgent ?? null,
				createdAt: new Date(entry.timestamp)
			});
		} catch (err) {
			console.error('[DatabaseTransport] Failed to write log entry:', err);
		}
	}
}
