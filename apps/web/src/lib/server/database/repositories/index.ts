// User repository exports
export { UserRepository, userRepository } from './user-repository';
export type {
	ProfileData,
	UserProfileUpdate,
	UpdateProfileResult,
	UserListParams,
	UserListItem
} from './user-repository';

// Permission repository exports
export {
	PermissionRepository,
	permissionRepository,
	type IPermissionRepository,
	type UserPermission,
	type PermissionListParams,
	type PermissionWithResource
} from './permissionRepository';

// App repository exports
export { AppRepository, appRepository, type AppEntity, type IAppRepository } from './appRepository';

// Group repository exports
export {
	GroupRepository,
	groupRepository,
	type GroupListParams,
	type GroupWithUsers
} from './group-repository';
export type {
	GroupPermissionRow,
	GroupWithUsersAndPermissions,
	GroupAppRow
} from './group-repository';

// Role repository exports
export { RoleRepository, roleRepository } from './role-repository';
export type { RolePermissionRow, RoleWithPermissions, RoleAppRow } from './role-repository';

// Resource repository exports
export {
	ResourceRepository,
	resourceRepository,
	type ResourceListParams
} from './resource-repository';

// Translation repository exports
export { TranslationRepository, translationRepository } from './translationRepository';

// Notification repository exports
export { notificationRepository } from './notificationRepository';

// Avatar repository exports
export { avatarRepository } from './avatarRepository';
export type { InsertAvatarData, UpsertAvatarConfigData } from './avatarRepository';

// Agent Config repository exports
export { agentConfigRepository } from './agentConfigRepository';
export type { UpsertAgentConfigData, AgentConfigWithMaskedKey } from './agentConfigRepository';

// AI Provider repository exports
export { aiProviderRepository } from './aiProviderRepository';
export type { ProviderWithConfigs, ProviderConfigMap } from './aiProviderRepository';

// Theme presets repository exports
export { themePresetsRepository } from './theme-presets-repository';

// Admin config repository exports
export { adminConfigRepository } from './adminConfigRepository';

// Email template repository exports
export { DatabaseTemplateRepository } from './email-template-repository';
export { TemplateCache, CACHE_KEYS } from './email-template-cache';
export { TemplateCacheManager } from './email-template-cache-manager';
export {
	createDatabaseTemplateRepository,
	getDatabaseTemplateRepository,
	resetDatabaseTemplateRepository,
	createHighPerformanceRepository,
	createDevelopmentRepository,
	createTestingRepository,
	createNoCacheRepository,
	createRepositoryForEnvironment
} from './email-template-repository-factory';

// Type exports
export type {
	DatabaseEmailTemplate,
	CreateTemplateData,
	UpdateTemplateData,
	IDatabaseTemplateRepository,
	ITemplateCache,
	CacheConfig,
	RepositoryConfig,
	MigrationResult,
	MigrationError,
	ValidationResult,
	MigrationBackup
} from '../types/email-templates';

export { DatabaseTemplateError } from '../types/email-templates';

// Performance monitoring exports
export { PerformanceMonitor, performanceMonitor } from './performance-monitor';
export { MonitoringService, monitoringService } from './monitoring-service';

// Security and audit exports
export { TemplateSecurityValidator, SecurityValidationError } from './template-security-validator';
export { TemplateAuditLogger, AuditEventType } from './template-audit-logger';
export { TemplateRateLimiter } from './template-rate-limiter';
export { TemplateSecurityService } from './template-security-service';
