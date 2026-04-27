/**
 * Admin Configuration Schema
 *
 * Centralizált admin-szintű konfigurációk (AI Assistant, Auth, Email, stb.)
 * A config_data JSONB mező flexibilis struktúrát biztosít különböző konfigurációs típusokhoz
 */

import { serial, varchar, jsonb, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { users } from '../../auth';
import { platformSchema as schema } from '../schema';

export const adminConfig = schema.table('admin_config', {
	id: serial('id').primaryKey(),
	configKey: varchar('config_key', { length: 100 }).unique().notNull(), // 'ai_assistant', 'auth', 'email', stb.
	configData: jsonb('config_data').notNull(), // Flexibilis JSON struktúra
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	createdBy: integer('created_by').references(() => users.id)
});

export type AdminConfig = InferSelectModel<typeof adminConfig>;
export type AdminConfigInsert = InferInsertModel<typeof adminConfig>;

/**
 * AI Assistant Configuration Type
 *
 * Ez a típus definiálja az 'ai_assistant' config_key-hez tartozó config_data struktúrát
 */
export interface AIAssistantConfig {
	enabled: boolean; // AI Agent globális engedélyezése/letiltása
	aiAgent: {
		provider: string; // 'openai', 'gemini', 'anthropic', stb.
		apiKeyEncrypted: string; // Titkosított API key
		model: string; // Model név (pl. 'gpt-4', 'gemini-pro')
		baseUrl?: string; // Opcionális egyéni endpoint
		advancedParams: {
			maxTokens: number;
			temperature: number;
			topP?: number;
		};
	};
	ttsProvider: {
		enabled: boolean; // TTS globális engedélyezése/letiltása
		provider: string; // 'browser', 'elevenlabs', stb.
		apiKeyEncrypted?: string; // Csak bizonyos providerekhez szükséges
		voiceId?: string; // Kiválasztott hang ID
		language?: string; // Nyelv kód
	};
}

/**
 * Authentication Configuration Type
 *
 * Ez a típus definiálja az 'auth' config_key-hez tartozó config_data struktúrát
 */
export interface AuthConfig {
	registrationEnabled: boolean; // Regisztráció engedélyezése/letiltása
	socialLoginEnabled: boolean; // Social provider bejelentkezés engedélyezése/letiltása
}
