import { relations } from 'drizzle-orm';

// Import platform tables
import { apps } from './apps/apps';
import { conversations } from './chat/conversations';
import { messages } from './chat/messages';
import { aiAvatars } from './ai-avatar/ai_avatars';
import { userAvatarConfigs } from './ai-avatar/user_avatar_configs';
import { aiAgentConfigs } from './ai-avatar/ai_agent_configs';

// Import auth tables for cross-schema relations
import { users } from '../auth/users/users';
import { roleAppAccess } from '../auth/apps/role_app_access';
import { groupAppAccess } from '../auth/apps/group_app_access';

// Apps relations
export const appsRelations = relations(apps, ({ many }) => ({
	roleAppAccess: many(roleAppAccess),
	groupAppAccess: many(groupAppAccess)
}));

// Conversations relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
	participant1: one(users, {
		fields: [conversations.participant1Id],
		references: [users.id]
	}),
	participant2: one(users, {
		fields: [conversations.participant2Id],
		references: [users.id]
	}),
	messages: many(messages)
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	sender: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	})
}));

// AI Avatar relations
export const aiAvatarsRelations = relations(aiAvatars, ({ many }) => ({
	userConfigs: many(userAvatarConfigs)
}));

export const userAvatarConfigsRelations = relations(userAvatarConfigs, ({ one }) => ({
	avatar: one(aiAvatars, {
		fields: [userAvatarConfigs.avatarIdname],
		references: [aiAvatars.idname]
	}),
	user: one(users, {
		fields: [userAvatarConfigs.userId],
		references: [users.id]
	})
}));

// AI Agent Config relations
export const aiAgentConfigsRelations = relations(aiAgentConfigs, ({ one }) => ({
	user: one(users, {
		fields: [aiAgentConfigs.userId],
		references: [users.id]
	})
}));
