/**
 * AI Agent Configuration Schema
 *
 * Tárolja a felhasználók AI agent API konfigurációit.
 * Az API key-ek titkosítva vannak tárolva.
 */

import { serial, integer, varchar, text, boolean, timestamp, decimal } from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';
import { platformSchema as schema } from '../schema';
import { users } from '../../auth/users/users';

export const aiAgentConfigs = schema.table('ai_agent_configs', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),

	// Provider típusa
	provider: varchar('provider', { length: 50 }).notNull(), // 'gemini', 'groq', 'openai', 'anthropic', 'huggingface', 'custom'

	// API kulcs (titkosítva tárolva)
	apiKey: text('api_key').notNull(),

	// Modell neve (provider-specifikus)
	modelName: varchar('model_name', { length: 100 }), // pl. 'gemini-1.5-flash', 'llama-3.1-70b-versatile'

	// Custom endpoint URL (opcionális)
	baseUrl: text('base_url'),

	// Generálási paraméterek
	maxTokens: integer('max_tokens').default(1000),
	temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.70'),

	// Aktív konfiguráció jelzése
	isActive: boolean('is_active').default(true).notNull(),

	// Időbélyegek
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript típusok
export type AiAgentConfigInsertModel = typeof aiAgentConfigs.$inferInsert;
export type AiAgentConfigSelectModel = InferSelectModel<typeof aiAgentConfigs>;
