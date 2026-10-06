/**
 * Pluginok által tárolt fájlok metaadatai.
 *
 * A fájl tartalma a lemezen van (`uploads/plugin-files/{pluginId}/…`), itt
 * csak a hivatkozás. A `plugin_id` szándékosan nem idegen kulcs: a plugin
 * eltávolítása után a fájlok és a metaadataik megmaradnak.
 * Lásd: .kiro/specs/plugin-file-storage.
 */

import { uuid, varchar, text, bigint, char, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { platformSchema as schema } from '../schema';
import { users } from '../../auth/users/users';

export const pluginFiles = schema.table(
	'plugin_files',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		pluginId: varchar('plugin_id', { length: 255 }).notNull(),
		/** A plugin fájlok gyökeréhez relatív útvonal */
		storagePath: text('storage_path').notNull().unique(),
		originalName: varchar('original_name', { length: 255 }).notNull(),
		mimeType: varchar('mime_type', { length: 100 }).notNull(),
		size: bigint('size', { mode: 'number' }).notNull(),
		sha256: char('sha256', { length: 64 }).notNull(),
		/** A plugin szabad hivatkozása (pl. `employee-document:42`), személyes adat nélkül */
		ref: varchar('ref', { length: 255 }),
		createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		/** NULL: feltöltve, de a plugin még nem kötötte a saját adataihoz */
		claimedAt: timestamp('claimed_at', { withTimezone: true })
	},
	(table) => [
		index('idx_plugin_files_plugin').on(table.pluginId),
		index('idx_plugin_files_unclaimed')
			.on(table.createdAt)
			.where(sql`${table.claimedAt} IS NULL`)
	]
);

export type PluginFile = typeof pluginFiles.$inferSelect;
export type NewPluginFile = typeof pluginFiles.$inferInsert;
