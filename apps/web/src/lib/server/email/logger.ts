import db from '$lib/server/database';
import { emailLogs } from '@racona/database/schemas';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import type {
	EmailLogParams,
	EmailLog,
	EmailLogFilters,
	EmailDeliveryStatus,
	EmailTemplateType
} from './types';

/**
 * Email logger for delivery tracking and audit
 */
export class EmailLogger {
	/**
	 * Log an email attempt
	 * @param params
	 */
	async logEmailAttempt(params: EmailLogParams): Promise<string> {
		try {
			const result = await db
				.insert(emailLogs)
				.values({
					messageId: params.messageId,
					recipient: params.recipient,
					subject: params.subject,
					templateType: params.template,
					status: params.status,
					errorMessage: params.errorMessage,
					sentAt: params.status === 'sent' ? new Date() : null
				})
				.returning({ id: emailLogs.id });

			const logId = result[0].id;

			this.log('debug', 'Email attempt logged', {
				logId,
				recipient: params.recipient,
				status: params.status
			});

			return logId;
		} catch (error) {
			this.log('error', 'Failed to log email attempt', {
				error: error instanceof Error ? error.message : 'Unknown error',
				params
			});
			throw error;
		}
	}

	/**
	 * Update email delivery status
	 * @param logId
	 * @param status
	 * @param messageId
	 * @param errorMessage
	 */
	async updateEmailStatus(
		logId: string,
		status: EmailDeliveryStatus,
		messageId?: string,
		errorMessage?: string
	): Promise<void> {
		try {
			const updateData: Partial<typeof emailLogs.$inferInsert> = {
				status,
				updatedAt: new Date()
			};

			// Set messageId if provided
			if (messageId) {
				updateData.messageId = messageId;
			}

			// Set error message if provided
			if (errorMessage) {
				updateData.errorMessage = errorMessage;
			}

			// Set timestamp based on status
			switch (status) {
				case 'sent':
					updateData.sentAt = new Date();
					break;
				case 'delivered':
					updateData.deliveredAt = new Date();
					break;
				case 'opened':
					updateData.openedAt = new Date();
					break;
				case 'clicked':
					updateData.clickedAt = new Date();
					break;
			}

			await db.update(emailLogs).set(updateData).where(eq(emailLogs.id, logId));

			this.log('debug', 'Email status updated', {
				logId,
				status,
				messageId
			});
		} catch (error) {
			this.log('error', 'Failed to update email status', {
				error: error instanceof Error ? error.message : 'Unknown error',
				logId,
				status
			});
			throw error;
		}
	}

	/**
	 * Update email status by message ID (for webhook processing)
	 * @param messageId
	 * @param status
	 * @param errorMessage
	 */
	async updateEmailStatusByMessageId(
		messageId: string,
		status: EmailDeliveryStatus,
		errorMessage?: string
	): Promise<void> {
		try {
			const updateData: Partial<typeof emailLogs.$inferInsert> = {
				status,
				updatedAt: new Date()
			};

			// Set error message if provided
			if (errorMessage) {
				updateData.errorMessage = errorMessage;
			}

			// Set timestamp based on status
			switch (status) {
				case 'delivered':
					updateData.deliveredAt = new Date();
					break;
				case 'opened':
					updateData.openedAt = new Date();
					break;
				case 'clicked':
					updateData.clickedAt = new Date();
					break;
				case 'bounced':
				case 'failed':
					// Keep existing timestamps, just update status and error
					break;
			}

			const result = await db
				.update(emailLogs)
				.set(updateData)
				.where(eq(emailLogs.messageId, messageId))
				.returning({ id: emailLogs.id });

			if (result.length === 0) {
				this.log('warn', 'No email log found for message ID', { messageId });
				return;
			}

			this.log('debug', 'Email status updated by message ID', {
				messageId,
				status,
				affectedRows: result.length
			});
		} catch (error) {
			this.log('error', 'Failed to update email status by message ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				messageId,
				status
			});
			throw error;
		}
	}

	/**
	 * Get email logs with filtering
	 * @param filters
	 */
	async getEmailLogs(filters: EmailLogFilters = {}): Promise<EmailLog[]> {
		try {
			// Build where conditions
			const conditions = [];

			if (filters.messageId) {
				conditions.push(eq(emailLogs.messageId, filters.messageId));
			}

			if (filters.recipient) {
				conditions.push(eq(emailLogs.recipient, filters.recipient));
			}

			if (filters.status) {
				conditions.push(eq(emailLogs.status, filters.status));
			}

			if (filters.template) {
				conditions.push(eq(emailLogs.templateType, filters.template));
			}

			if (filters.dateFrom) {
				conditions.push(gte(emailLogs.createdAt, filters.dateFrom));
			}

			if (filters.dateTo) {
				conditions.push(lte(emailLogs.createdAt, filters.dateTo));
			}

			// Build query
			let query = db.select().from(emailLogs);

			// Apply conditions
			if (conditions.length > 0) {
				query = query.where(and(...conditions)) as typeof query;
			}

			// Apply ordering (newest first by default)
			query = query.orderBy(desc(emailLogs.createdAt)) as typeof query;

			// Apply pagination
			if (filters.limit) {
				query = query.limit(filters.limit) as typeof query;
			}

			if (filters.offset) {
				query = query.offset(filters.offset) as typeof query;
			}

			const results = await query;

			this.log('debug', 'Email logs retrieved', {
				count: results.length,
				filters
			});

			return results.map(this.mapDbRowToEmailLog);
		} catch (error) {
			this.log('error', 'Failed to get email logs', {
				error: error instanceof Error ? error.message : 'Unknown error',
				filters
			});
			throw error;
		}
	}

	/**
	 * Get email log by ID
	 * @param id
	 */
	async getEmailLogById(id: string): Promise<EmailLog | null> {
		try {
			const results = await db.select().from(emailLogs).where(eq(emailLogs.id, id)).limit(1);

			if (results.length === 0) {
				return null;
			}

			return this.mapDbRowToEmailLog(results[0]);
		} catch (error) {
			this.log('error', 'Failed to get email log by ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				id
			});
			throw error;
		}
	}

	/**
	 * Get email statistics
	 * @param dateFrom
	 * @param dateTo
	 */
	async getEmailStats(
		dateFrom?: Date,
		dateTo?: Date
	): Promise<{
		total: number;
		sent: number;
		delivered: number;
		failed: number;
		pending: number;
	}> {
		try {
			const conditions = [];

			if (dateFrom) {
				conditions.push(gte(emailLogs.createdAt, dateFrom));
			}

			if (dateTo) {
				conditions.push(lte(emailLogs.createdAt, dateTo));
			}

			// Build the query properly
			const queryBuilder = db
				.select({
					status: emailLogs.status,
					count: count(emailLogs.id)
				})
				.from(emailLogs);

			// Apply conditions if any
			const conditionalQuery =
				conditions.length > 0 ? queryBuilder.where(and(...conditions)) : queryBuilder;

			// Group by status
			const results = await conditionalQuery.groupBy(emailLogs.status);

			// Count by status
			const stats = {
				total: 0,
				sent: 0,
				delivered: 0,
				failed: 0,
				pending: 0
			};

			results.forEach((row) => {
				stats.total++;
				switch (row.status) {
					case 'sent':
						stats.sent++;
						break;
					case 'delivered':
						stats.delivered++;
						break;
					case 'failed':
					case 'bounced':
						stats.failed++;
						break;
					case 'pending':
						stats.pending++;
						break;
				}
			});

			this.log('debug', 'Email statistics retrieved', stats);

			return stats;
		} catch (error) {
			this.log('error', 'Failed to get email statistics', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Clean up old email logs (for maintenance)
	 * @param olderThanDays
	 */
	async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

			const result = await db
				.delete(emailLogs)
				.where(lte(emailLogs.createdAt, cutoffDate))
				.returning({ id: emailLogs.id });

			const deletedCount = result.length;

			this.log('info', 'Old email logs cleaned up', {
				deletedCount,
				cutoffDate: cutoffDate.toISOString()
			});

			return deletedCount;
		} catch (error) {
			this.log('error', 'Failed to cleanup old logs', {
				error: error instanceof Error ? error.message : 'Unknown error',
				olderThanDays
			});
			throw error;
		}
	}

	/**
	 * Map database row to EmailLog interface.
	 * @param row
	 */
	private mapDbRowToEmailLog(row: typeof emailLogs.$inferSelect): EmailLog {
		return {
			id: row.id,
			messageId: row.messageId || undefined,
			recipient: row.recipient,
			subject: row.subject,
			templateType: row.templateType as EmailTemplateType | undefined,
			status: row.status as EmailDeliveryStatus,
			errorMessage: row.errorMessage || undefined,
			sentAt: row.sentAt || undefined,
			deliveredAt: row.deliveredAt || undefined,
			openedAt: row.openedAt || undefined,
			clickedAt: row.clickedAt || undefined,
			createdAt: row.createdAt!,
			updatedAt: row.updatedAt!
		};
	}

	/**
	 * Logging utility
	 * @param level
	 * @param message
	 * @param data
	 */
	private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
		if (level === 'debug') return;
		// Use console for now, could be enhanced with proper logging library
		const timestamp = new Date().toISOString();
		const logData = data ? ` ${JSON.stringify(data)}` : '';
		console[level](`[${timestamp}] [EmailLogger] ${message}${logData}`);
	}
}
