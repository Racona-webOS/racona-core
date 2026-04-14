import { eq, and, inArray } from 'drizzle-orm';
import db from '../index';
import { emailTemplates } from '@racona/database/schemas';
import type {
	DatabaseEmailTemplate,
	CreateTemplateData,
	UpdateTemplateData,
	IDatabaseTemplateRepository,
	ITemplateCache,
	RepositoryConfig
} from '../types/email-templates';
import { DatabaseTemplateError } from '../types/email-templates';
import type { EmailTemplateType } from '../../email/types';
import { TemplateCache, CACHE_KEYS } from './email-template-cache';
import { performanceMonitor } from './performance-monitor';
import { TemplateSecurityValidator } from './template-security-validator';
import { TemplateAuditLogger } from './template-audit-logger';
import { TemplateRateLimiter } from './template-rate-limiter';

/**
 * Database template repository implementation using Drizzle ORM with security and audit features.
 */
export class DatabaseTemplateRepository implements IDatabaseTemplateRepository {
	private cache: ITemplateCache;
	private config: RepositoryConfig;
	private securityValidator: TemplateSecurityValidator;
	private auditLogger: TemplateAuditLogger;
	private rateLimiter: TemplateRateLimiter;

	constructor(config: RepositoryConfig) {
		this.config = config;
		this.cache = new TemplateCache(config.cacheConfig);
		this.securityValidator = new TemplateSecurityValidator();
		this.auditLogger = new TemplateAuditLogger({
			enabled: true,
			logLevel: 'info',
			maskSensitiveData: true,
			retentionDays: 90,
			maxLogSize: 1024 * 1024 * 10, // 10MB
			enableFileLogging: false,
			enableDatabaseLogging: true
		});
		this.rateLimiter = new TemplateRateLimiter();
	}

	/**
	 * Get template by type with caching, rate limiting, and audit logging.
	 * @param type The email template type to retrieve.
	 * @param locale The locale for the template (defaults to 'hu').
	 * @param context Additional context for audit logging.
	 * @param context.userId
	 * @param context.userAgent
	 * @param context.ipAddress
	 * @param context.sessionId
	 * @param context.requestId
	 * @returns The template or null if not found.
	 */
	async getTemplateByType(
		type: EmailTemplateType,
		locale: string = 'hu',
		context?: {
			userId?: string;
			userAgent?: string;
			ipAddress?: string;
			sessionId?: string;
			requestId?: string;
		}
	): Promise<DatabaseEmailTemplate | null> {
		const endTiming = performanceMonitor.startTiming('getTemplateByType', { type, locale });

		try {
			// Check rate limits
			const identifier = context?.userId || context?.ipAddress || 'anonymous';
			const rateLimitResults = this.rateLimiter.checkMultipleRateLimits(
				['template_access', 'global_template'],
				identifier
			);

			// Check if any rate limit is exceeded
			for (const [operation, result] of rateLimitResults) {
				if (!result.allowed) {
					await this.auditLogger.logSecurityViolation(
						'rate_limit_exceeded',
						{
							operation,
							identifier,
							remaining: result.remaining,
							resetTime: result.resetTime
						},
						{ ...context, templateType: type }
					);
					throw this.createError(
						DatabaseTemplateError.RATE_LIMIT_EXCEEDED,
						`Rate limit exceeded for ${operation}. Try again after ${result.resetTime.toISOString()}`
					);
				}
			}

			const cacheKey = CACHE_KEYS.templateByType(type) + `:${locale}`;
			let cacheHit = false;

			// Try cache first if enabled
			if (this.config.enableCache) {
				const cached = await this.cache.get(cacheKey);
				if (cached) {
					cacheHit = true;
					endTiming();

					// Log template access
					await this.auditLogger.logTemplateAccessed(type, cached.id, {
						...context,
						cacheHit
					});

					return cached;
				}
			}

			// Query database with locale
			const result = await db
				.select()
				.from(emailTemplates)
				.where(
					and(
						eq(emailTemplates.type, type),
						eq(emailTemplates.locale, locale),
						eq(emailTemplates.isActive, true)
					)
				)
				.limit(1);

			let template = result[0] || null;

			// Fallback to default locale if not found
			if (!template && locale !== 'hu') {
				const fallbackResult = await db
					.select()
					.from(emailTemplates)
					.where(
						and(
							eq(emailTemplates.type, type),
							eq(emailTemplates.locale, 'hu'),
							eq(emailTemplates.isActive, true)
						)
					)
					.limit(1);
				template = fallbackResult[0] || null;
			}

			// Cache the result if found and caching is enabled
			if (template && this.config.enableCache) {
				await this.cache.set(cacheKey, template, this.config.cacheConfig.templateByTypeTtl);
			}

			// Log template access
			if (template) {
				await this.auditLogger.logTemplateAccessed(type, template.id, {
					...context,
					cacheHit
				});
			}

			endTiming();
			return template;
		} catch (error) {
			endTiming();

			// Log error if it's not a rate limit error
			if (!(error instanceof Error && error.message.includes('Rate limit exceeded'))) {
				await this.auditLogger.logSecurityViolation(
					'template_access_error',
					{
						error: error instanceof Error ? error.message : 'Unknown error',
						templateType: type
					},
					context
				);
			}

			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to get template by type ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get all active templates.
	 * @returns Array of all active templates.
	 */
	async getAllActiveTemplates(): Promise<DatabaseEmailTemplate[]> {
		const endTiming = performanceMonitor.startTiming('getAllActiveTemplates');
		try {
			const templates = await db
				.select()
				.from(emailTemplates)
				.where(eq(emailTemplates.isActive, true))
				.orderBy(emailTemplates.type);

			endTiming();
			return templates;
		} catch (error) {
			endTiming();
			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to get all active templates: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get template by ID with caching.
	 * @param id - The template ID to retrieve.
	 * @returns The template or null if not found.
	 */
	async getTemplateById(id: string): Promise<DatabaseEmailTemplate | null> {
		const cacheKey = CACHE_KEYS.templateById(id);

		// Try cache first if enabled
		if (this.config.enableCache) {
			const cached = await this.cache.get(cacheKey);
			if (cached) {
				return cached;
			}
		}

		// Query database
		try {
			const result = await db
				.select()
				.from(emailTemplates)
				.where(eq(emailTemplates.id, id))
				.limit(1);

			const template = result[0] || null;

			// Cache the result if found and caching is enabled
			if (template && this.config.enableCache) {
				await this.cache.set(cacheKey, template, this.config.cacheConfig.templateByIdTtl);
			}

			return template;
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to get template by ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Create a new template with security validation and audit logging.
	 * @param templateData - The template data to create.
	 * @param context - Additional context for audit logging.
	 * @param context.userId
	 * @param context.userAgent
	 * @param context.ipAddress
	 * @param context.sessionId
	 * @param context.requestId
	 * @returns The created template.
	 */
	async createTemplate(
		templateData: CreateTemplateData,
		context?: {
			userId?: string;
			userAgent?: string;
			ipAddress?: string;
			sessionId?: string;
			requestId?: string;
		}
	): Promise<DatabaseEmailTemplate> {
		try {
			// Check rate limits
			const identifier = context?.userId || context?.ipAddress || 'anonymous';
			const rateLimitResults = this.rateLimiter.checkMultipleRateLimits(
				['template_create', 'global_template'],
				identifier
			);

			for (const [operation, result] of rateLimitResults) {
				if (!result.allowed) {
					await this.auditLogger.logSecurityViolation(
						'rate_limit_exceeded',
						{
							operation,
							identifier,
							remaining: result.remaining,
							resetTime: result.resetTime
						},
						{ ...context, templateType: templateData.type }
					);
					throw this.createError(
						DatabaseTemplateError.RATE_LIMIT_EXCEEDED,
						`Rate limit exceeded for ${operation}. Try again after ${result.resetTime.toISOString()}`
					);
				}
			}

			// Security validation
			const securityResult = this.securityValidator.validateCreateTemplate(templateData);
			if (!securityResult.isValid) {
				await this.auditLogger.logSecurityViolation(
					'template_validation_failed',
					{
						errors: securityResult.errors,
						warnings: securityResult.warnings,
						templateType: templateData.type
					},
					context
				);

				throw this.createError(
					DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
					`Security validation failed: ${securityResult.errors.join(', ')}`
				);
			}

			// Use sanitized content if available
			const sanitizedData = {
				...templateData,
				subjectTemplate:
					securityResult.sanitizedContent?.subjectTemplate || templateData.subjectTemplate,
				htmlTemplate: securityResult.sanitizedContent?.htmlTemplate || templateData.htmlTemplate,
				textTemplate: securityResult.sanitizedContent?.textTemplate || templateData.textTemplate
			};

			// Validate template data
			this.validateTemplateData(sanitizedData);

			// Check if template type already exists for this locale
			const existing = await this.getTemplateByType(
				sanitizedData.type,
				sanitizedData.locale || 'hu'
			);
			if (existing) {
				throw this.createError(
					DatabaseTemplateError.DUPLICATE_TEMPLATE_TYPE,
					`Template with type ${sanitizedData.type} and locale ${sanitizedData.locale || 'hu'} already exists`
				);
			}

			const result = await db
				.insert(emailTemplates)
				.values({
					type: sanitizedData.type,
					locale: sanitizedData.locale || 'hu',
					name: sanitizedData.name,
					subjectTemplate: sanitizedData.subjectTemplate,
					htmlTemplate: sanitizedData.htmlTemplate,
					textTemplate: sanitizedData.textTemplate,
					requiredData: sanitizedData.requiredData,
					optionalData: sanitizedData.optionalData || [],
					isActive: true
				})
				.returning();

			const newTemplate = result[0];

			// Log template creation
			await this.auditLogger.logTemplateCreated(sanitizedData, context);

			// Invalidate relevant caches
			if (this.config.enableCache) {
				await this.invalidateCache(sanitizedData.type);
				await this.auditLogger.logCacheInvalidated(sanitizedData.type, {
					...context,
					reason: 'template_created'
				});
			}

			return newTemplate;
		} catch (error) {
			// Log creation failure
			if (!(error instanceof Error && error.message.includes('Rate limit exceeded'))) {
				await this.auditLogger.logSecurityViolation(
					'template_creation_failed',
					{
						error: error instanceof Error ? error.message : 'Unknown error',
						templateType: templateData.type
					},
					context
				);
			}

			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Update an existing template with security validation and audit logging.
	 * @param id - The template ID to update.
	 * @param updates - The updates to apply.
	 * @param context - Additional context for audit logging.
	 * @param context.userId
	 * @param context.userAgent
	 * @param context.ipAddress
	 * @param context.sessionId
	 * @param context.requestId
	 * @returns The updated template.
	 */
	async updateTemplate(
		id: string,
		updates: UpdateTemplateData,
		context?: {
			userId?: string;
			userAgent?: string;
			ipAddress?: string;
			sessionId?: string;
			requestId?: string;
		}
	): Promise<DatabaseEmailTemplate> {
		try {
			// Check rate limits
			const identifier = context?.userId || context?.ipAddress || 'anonymous';
			const rateLimitResults = this.rateLimiter.checkMultipleRateLimits(
				['template_update', 'global_template'],
				identifier
			);

			for (const [operation, result] of rateLimitResults) {
				if (!result.allowed) {
					await this.auditLogger.logSecurityViolation(
						'rate_limit_exceeded',
						{
							operation,
							identifier,
							remaining: result.remaining,
							resetTime: result.resetTime
						},
						{ ...context, templateId: id }
					);
					throw this.createError(
						DatabaseTemplateError.RATE_LIMIT_EXCEEDED,
						`Rate limit exceeded for ${operation}. Try again after ${result.resetTime.toISOString()}`
					);
				}
			}

			// Security validation
			const securityResult = this.securityValidator.validateUpdateTemplate(updates);
			if (!securityResult.isValid) {
				await this.auditLogger.logSecurityViolation(
					'template_validation_failed',
					{
						errors: securityResult.errors,
						warnings: securityResult.warnings,
						templateId: id
					},
					context
				);

				throw this.createError(
					DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
					`Security validation failed: ${securityResult.errors.join(', ')}`
				);
			}

			// Use sanitized content if available
			const sanitizedUpdates = {
				...updates,
				...(securityResult.sanitizedContent?.subjectTemplate && {
					subjectTemplate: securityResult.sanitizedContent.subjectTemplate
				}),
				...(securityResult.sanitizedContent?.htmlTemplate && {
					htmlTemplate: securityResult.sanitizedContent.htmlTemplate
				}),
				...(securityResult.sanitizedContent?.textTemplate && {
					textTemplate: securityResult.sanitizedContent.textTemplate
				})
			};

			// Validate update data
			this.validateUpdateData(sanitizedUpdates);

			// Check if template exists
			const existing = await this.getTemplateById(id);
			if (!existing) {
				throw this.createError(
					DatabaseTemplateError.TEMPLATE_NOT_FOUND,
					`Template with ID ${id} not found`
				);
			}

			const result = await db
				.update(emailTemplates)
				.set({
					...sanitizedUpdates,
					updatedAt: new Date()
				})
				.where(eq(emailTemplates.id, id))
				.returning();

			const updatedTemplate = result[0];

			// Log template update
			await this.auditLogger.logTemplateUpdated(id, sanitizedUpdates, existing, context);

			// Invalidate relevant caches
			if (this.config.enableCache) {
				await this.invalidateCache(existing.type as EmailTemplateType);
				await this.cache.delete(CACHE_KEYS.templateById(id));
				await this.auditLogger.logCacheInvalidated(existing.type as EmailTemplateType, {
					...context,
					reason: 'template_updated'
				});
			}

			return updatedTemplate;
		} catch (error) {
			// Log update failure
			if (!(error instanceof Error && error.message.includes('Rate limit exceeded'))) {
				await this.auditLogger.logSecurityViolation(
					'template_update_failed',
					{
						error: error instanceof Error ? error.message : 'Unknown error',
						templateId: id
					},
					context
				);
			}

			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Deactivate a template.
	 * @param id - The template ID to deactivate.
	 */
	async deactivateTemplate(id: string): Promise<void> {
		const existing = await this.getTemplateById(id);
		if (!existing) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_NOT_FOUND,
				`Template with ID ${id} not found`
			);
		}

		try {
			await db
				.update(emailTemplates)
				.set({
					isActive: false,
					updatedAt: new Date()
				})
				.where(eq(emailTemplates.id, id));

			// Invalidate relevant caches
			if (this.config.enableCache) {
				await this.invalidateCache(existing.type as EmailTemplateType);
				await this.cache.delete(CACHE_KEYS.templateById(id));
			}
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to deactivate template: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Activate a template.
	 * @param id - The template ID to activate.
	 */
	async activateTemplate(id: string): Promise<void> {
		const existing = await this.getTemplateById(id);
		if (!existing) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_NOT_FOUND,
				`Template with ID ${id} not found`
			);
		}

		try {
			await db
				.update(emailTemplates)
				.set({
					isActive: true,
					updatedAt: new Date()
				})
				.where(eq(emailTemplates.id, id));

			// Invalidate relevant caches
			if (this.config.enableCache) {
				await this.invalidateCache(existing.type as EmailTemplateType);
				await this.cache.delete(CACHE_KEYS.templateById(id));
			}
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
				`Failed to activate template: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get multiple templates by types (optimized batch operation).
	 * @param types Array of template types to retrieve.
	 * @param locale The locale for the templates (defaults to 'hu').
	 * @returns Map of template types to templates.
	 */
	async getTemplatesByTypes(
		types: EmailTemplateType[],
		locale: string = 'hu'
	): Promise<Map<EmailTemplateType, DatabaseEmailTemplate>> {
		const endTiming = performanceMonitor.startTiming('getTemplatesByTypes', {
			typesCount: types.length,
			locale
		});

		if (types.length === 0) {
			endTiming();
			return new Map();
		}

		const result = new Map<EmailTemplateType, DatabaseEmailTemplate>();
		const uncachedTypes: EmailTemplateType[] = [];

		// Performance monitoring
		const startTime = Date.now();

		// Check cache for each type if caching is enabled
		if (this.config.enableCache) {
			const cacheKeys = types.map((type) => CACHE_KEYS.templateByType(type) + `:${locale}`);
			const cached = await this.cache.getMultiple(cacheKeys);

			for (const type of types) {
				const cacheKey = CACHE_KEYS.templateByType(type) + `:${locale}`;
				const cachedTemplate = cached.get(cacheKey);

				if (cachedTemplate) {
					result.set(type, cachedTemplate);
				} else {
					uncachedTypes.push(type);
				}
			}
		} else {
			uncachedTypes.push(...types);
		}

		// Query database for uncached types using optimized IN query
		if (uncachedTypes.length > 0) {
			try {
				const templates = await db
					.select()
					.from(emailTemplates)
					.where(
						and(
							eq(emailTemplates.isActive, true),
							eq(emailTemplates.locale, locale),
							inArray(emailTemplates.type, uncachedTypes)
						)
					)
					.orderBy(emailTemplates.type); // Use index for sorting

				// Add to result and cache in batch
				const cacheEntries = new Map<string, DatabaseEmailTemplate>();
				const foundTypes = new Set<string>();

				for (const template of templates) {
					const type = template.type as EmailTemplateType;
					result.set(type, template);
					foundTypes.add(type);

					// Prepare for batch caching
					if (this.config.enableCache) {
						const cacheKey = CACHE_KEYS.templateByType(type) + `:${locale}`;
						cacheEntries.set(cacheKey, template);
					}
				}

				// Fallback to default locale for missing templates
				if (locale !== 'hu') {
					const missingTypes = uncachedTypes.filter((t) => !foundTypes.has(t));
					if (missingTypes.length > 0) {
						const fallbackTemplates = await db
							.select()
							.from(emailTemplates)
							.where(
								and(
									eq(emailTemplates.isActive, true),
									eq(emailTemplates.locale, 'hu'),
									inArray(emailTemplates.type, missingTypes)
								)
							);

						for (const template of fallbackTemplates) {
							const type = template.type as EmailTemplateType;
							result.set(type, template);

							if (this.config.enableCache) {
								const cacheKey = CACHE_KEYS.templateByType(type) + `:${locale}`;
								cacheEntries.set(cacheKey, template);
							}
						}
					}
				}

				// Batch cache operation
				if (this.config.enableCache && cacheEntries.size > 0) {
					await this.cache.setMultiple(cacheEntries, this.config.cacheConfig.templateByTypeTtl);
				}

				// Log performance metrics
				const duration = Date.now() - startTime;
				if (duration > 100) {
					// Log slow queries
					console.warn(
						`[DatabaseTemplateRepository] Slow batch query: ${duration}ms for ${types.length} types`
					);
				}
			} catch (error) {
				endTiming();
				throw this.createError(
					DatabaseTemplateError.DATABASE_CONNECTION_ERROR,
					`Failed to get templates by types: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		endTiming();
		return result;
	}

	/**
	 * Invalidate cache for specific template type or all caches.
	 * @param type - Optional template type to invalidate specific cache.
	 */
	async invalidateCache(type?: EmailTemplateType): Promise<void> {
		if (!this.config.enableCache) {
			return;
		}

		try {
			if (type) {
				// Invalidate specific type cache
				await this.cache.delete(CACHE_KEYS.templateByType(type));
			}

			// Always invalidate all active templates cache when any template changes
			await this.cache.delete(CACHE_KEYS.allActiveTemplates);
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.CACHE_ERROR,
				`Failed to invalidate cache: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Refresh cache by clearing all entries.
	 */
	async refreshCache(): Promise<void> {
		if (!this.config.enableCache) {
			return;
		}

		try {
			await this.cache.clear();
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.CACHE_ERROR,
				`Failed to refresh cache: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Warm up cache by preloading frequently used templates.
	 * @param templateTypes Optional array of specific types to warm up.
	 */
	async warmUpCache(templateTypes?: EmailTemplateType[]): Promise<void> {
		if (!this.config.enableCache) {
			return;
		}

		const startTime = Date.now();

		try {
			let templates: DatabaseEmailTemplate[];

			if (templateTypes && templateTypes.length > 0) {
				// Warm up specific template types
				const templateMap = await this.getTemplatesByTypes(templateTypes);
				templates = Array.from(templateMap.values());
			} else {
				// Warm up all active templates
				templates = await this.getAllActiveTemplates();
			}

			// Prepare cache entries
			const cacheEntries = new Map<string, DatabaseEmailTemplate>();

			for (const template of templates) {
				const typeKey = CACHE_KEYS.templateByType(template.type as EmailTemplateType);
				const idKey = CACHE_KEYS.templateById(template.id);

				cacheEntries.set(typeKey, template);
				cacheEntries.set(idKey, template);
			}

			// Batch cache all templates
			await this.cache.setMultiple(cacheEntries);

			// Cache all active templates list
			await this.cache.set(
				CACHE_KEYS.allActiveTemplates,
				templates[0], // Placeholder - we'll enhance this later
				this.config.cacheConfig.allActiveTemplatesTtl
			);

			const duration = Date.now() - startTime;
			console.info(
				`[DatabaseTemplateRepository] Cache warmed up with ${templates.length} templates in ${duration}ms`
			);
		} catch (error) {
			throw this.createError(
				DatabaseTemplateError.CACHE_ERROR,
				`Failed to warm up cache: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get cache performance metrics.
	 * @returns Cache statistics and performance data.
	 */
	getCacheMetrics(): {
		enabled: boolean;
		stats?: ReturnType<ITemplateCache['getStats']>;
	} {
		if (!this.config.enableCache) {
			return { enabled: false };
		}

		return {
			enabled: true,
			stats: this.cache.getStats()
		};
	}

	/**
	 * Get comprehensive performance metrics including database and cache.
	 * @returns Complete performance metrics.
	 */
	getPerformanceMetrics(): {
		database: ReturnType<typeof performanceMonitor.getOverallStats>;
		cache: ReturnType<DatabaseTemplateRepository['getCacheMetrics']>;
		export: ReturnType<typeof performanceMonitor.exportMetrics>;
	} {
		return {
			database: performanceMonitor.getOverallStats(),
			cache: this.getCacheMetrics(),
			export: performanceMonitor.exportMetrics()
		};
	}

	/**
	 * Validate template creation data.
	 * @param data - The template data to validate.
	 */
	private validateTemplateData(data: CreateTemplateData): void {
		if (!data.type?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Template type is required'
			);
		}

		if (!data.name?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Template name is required'
			);
		}

		if (!data.subjectTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Subject template is required'
			);
		}

		if (!data.htmlTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'HTML template is required'
			);
		}

		if (!data.textTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Text template is required'
			);
		}

		if (!Array.isArray(data.requiredData)) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Required data must be an array'
			);
		}

		// Validate template size limits (1MB max)
		const totalSize =
			data.subjectTemplate.length + data.htmlTemplate.length + data.textTemplate.length;
		if (totalSize > 1024 * 1024) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Template content exceeds 1MB limit'
			);
		}
	}

	/**
	 * Validate template update data.
	 * @param data - The update data to validate.
	 */
	private validateUpdateData(data: UpdateTemplateData): void {
		if (data.name !== undefined && !data.name?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Template name cannot be empty'
			);
		}

		if (data.subjectTemplate !== undefined && !data.subjectTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Subject template cannot be empty'
			);
		}

		if (data.htmlTemplate !== undefined && !data.htmlTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'HTML template cannot be empty'
			);
		}

		if (data.textTemplate !== undefined && !data.textTemplate?.trim()) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Text template cannot be empty'
			);
		}

		if (data.requiredData !== undefined && !Array.isArray(data.requiredData)) {
			throw this.createError(
				DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
				'Required data must be an array'
			);
		}

		// Validate template size limits if content fields are being updated
		if (data.subjectTemplate || data.htmlTemplate || data.textTemplate) {
			const totalSize =
				(data.subjectTemplate || '').length +
				(data.htmlTemplate || '').length +
				(data.textTemplate || '').length;
			if (totalSize > 1024 * 1024) {
				throw this.createError(
					DatabaseTemplateError.TEMPLATE_VALIDATION_FAILED,
					'Template content exceeds 1MB limit'
				);
			}
		}
	}

	/**
	 * Create a standardized error.
	 * @param type - The error type.
	 * @param message - The error message.
	 * @returns A standardized error object
	 */
	private createError(type: DatabaseTemplateError, message: string): Error {
		const error = new Error(message) as Error & { type: DatabaseTemplateError };
		error.type = type;
		return error;
	}
}
