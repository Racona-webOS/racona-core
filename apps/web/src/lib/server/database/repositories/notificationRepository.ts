import db from '$lib/server/database';
import { notifications, type Notification, type NewNotification } from '@racona/database/schemas';
import { eq, and, desc, asc, count } from 'drizzle-orm';

export const notificationRepository = {
	/**
	 * Create a new notification
	 */
	async create(notification: NewNotification): Promise<Notification> {
		const [created] = await db.insert(notifications).values(notification).returning();
		return created;
	},

	/**
	 * Get all notifications for a user
	 */
	async getByUserId(userId: number, limit = 50): Promise<Notification[]> {
		return db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);
	},

	/**
	 * Get unread notifications for a user
	 */
	async getUnreadByUserId(userId: number): Promise<Notification[]> {
		return db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
			.orderBy(desc(notifications.createdAt));
	},

	/**
	 * Get unread count for a user
	 */
	async getUnreadCount(userId: number): Promise<number> {
		const result = await db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
		return result.length;
	},

	/**
	 * Mark notification as read
	 */
	async markAsRead(id: number): Promise<Notification | undefined> {
		const [updated] = await db
			.update(notifications)
			.set({ isRead: true, readAt: new Date() })
			.where(eq(notifications.id, id))
			.returning();
		return updated;
	},

	/**
	 * Mark all notifications as read for a user
	 */
	async markAllAsRead(userId: number): Promise<void> {
		await db
			.update(notifications)
			.set({ isRead: true, readAt: new Date() })
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
	},

	/**
	 * Delete a notification
	 */
	async delete(id: number): Promise<void> {
		await db.delete(notifications).where(eq(notifications.id, id));
	},

	/**
	 * Delete all notifications for a user
	 */
	async deleteAllByUserId(userId: number): Promise<void> {
		await db.delete(notifications).where(eq(notifications.userId, userId));
	},

	/**
	 * Find many notifications with pagination
	 */
	async findManyPaginated(params: {
		userId: number;
		limit: number;
		offset: number;
		sortBy?: 'createdAt' | 'type';
		sortOrder?: 'asc' | 'desc';
	}): Promise<Notification[]> {
		const { userId, limit, offset, sortBy = 'createdAt', sortOrder = 'desc' } = params;

		const orderByColumn = sortBy === 'type' ? notifications.type : notifications.createdAt;
		const orderFn = sortOrder === 'asc' ? asc : desc;

		return db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(orderFn(orderByColumn))
			.limit(limit)
			.offset(offset);
	},

	/**
	 * Count all notifications for a user
	 */
	async countByUserId(userId: number): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(notifications)
			.where(eq(notifications.userId, userId));
		return result[0]?.count || 0;
	}
};
