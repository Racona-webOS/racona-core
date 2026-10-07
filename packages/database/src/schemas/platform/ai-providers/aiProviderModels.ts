import { serial, integer, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { platformSchema as schema } from '../schema';
import { aiProviders } from './aiProviders';

/**
 * AI provider modelljei — az AI asszisztens beállításainál ezekből lehet választani.
 * A beépített modellek a seedből jönnek (is_builtin), az admin felvehet sajátot is.
 */
export const aiProviderModels = schema.table(
	'ai_provider_models',
	{
		id: serial('id').primaryKey(),
		providerId: integer('provider_id')
			.references(() => aiProviders.id, { onDelete: 'cascade' })
			.notNull(),
		modelId: varchar('model_id', { length: 150 }).notNull(), // Az API-nak küldött azonosító
		displayName: varchar('display_name', { length: 150 }).notNull(),
		isDefault: boolean('is_default').default(false).notNull(), // Providerenként legfeljebb egy
		isEnabled: boolean('is_enabled').default(true).notNull(),
		isBuiltin: boolean('is_builtin').default(false).notNull(), // Seedből jött: nem törölhető, csak letiltható
		sortOrder: integer('sort_order').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		providerModelUnique: unique().on(table.providerId, table.modelId)
	})
);

export type AiProviderModel = InferSelectModel<typeof aiProviderModels>;
export type AiProviderModelInsert = InferInsertModel<typeof aiProviderModels>;
