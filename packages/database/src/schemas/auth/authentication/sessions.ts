import { serial, integer, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { authSchema as schema } from '../schema';
import { users } from '../users/users';

export const sessions = schema.table(
	'sessions',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		token: varchar('token', { length: 255 }).notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ipAddress: varchar('ip_address', { length: 255 }),
		userAgent: text('user_agent'),
		/** `desktop` vagy `mobile`: felhasználónként eszköztípusonként egy munkamenet él. NULL: régi munkamenet, asztalinak számít. */
		deviceType: varchar('device_type', { length: 16 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(table) => [index('idx_sessions_user_id').on(table.userId)]
);
