import { TemplateEngine } from './engine';
import { EmailTemplateType } from '../types';
import type { EmailTemplate, TemplateData } from './engine';
import type {
	IDatabaseTemplateRepository,
	DatabaseEmailTemplate
} from '../../database/types/email-templates';
import { DatabaseTemplateRepository } from '../../database/repositories/email-template-repository';

/**
 * Template registry for managing email templates from database.
 * All templates must be stored in the database - no file-based fallback.
 */
export class TemplateRegistry {
	private engine: TemplateEngine;
	private customTemplates: Map<string, EmailTemplate> = new Map();
	private templateInheritance: Map<string, string> = new Map();
	private databaseRepository: IDatabaseTemplateRepository;

	constructor(databaseRepository?: IDatabaseTemplateRepository) {
		this.engine = new TemplateEngine();

		// Initialize database repository with default config if not provided
		this.databaseRepository =
			databaseRepository ||
			new DatabaseTemplateRepository({
				enableCache: true,
				cacheConfig: {
					defaultTtl: 3600, // 1 hour
					templateByTypeTtl: 3600, // 1 hour
					allActiveTemplatesTtl: 1800, // 30 minutes
					templateByIdTtl: 7200 // 2 hours
				},
				retryAttempts: 3,
				retryDelay: 1000
			});

		this.log('info', 'TemplateRegistry initialized (database-only mode)');
	}

	/**
	 * Register a custom template.
	 * @param name - Template name.
	 * @param template - Template definition.
	 * @param parentTemplate - Optional parent template for inheritance.
	 */
	registerCustomTemplate(name: string, template: EmailTemplate, parentTemplate?: string): void {
		try {
			this.validateTemplateName(name);

			let finalTemplate = template;
			if (parentTemplate) {
				finalTemplate = this.inheritFromTemplate(template, parentTemplate);
				this.templateInheritance.set(name, parentTemplate);
			}

			this.validateCustomTemplate(finalTemplate);
			this.customTemplates.set(name, finalTemplate);

			this.log('info', 'Custom template registered', {
				name,
				parentTemplate,
				requiredData: finalTemplate.requiredData
			});
		} catch (error) {
			this.log('error', 'Failed to register custom template', {
				name,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Render a template from database or custom templates.
	 * @param templateName - Template type or custom name.
	 * @param data - Template data.
	 * @param context - Audit context.
	 * @param locale - Locale code (defaults to 'hu').
	 * @returns Rendered template with subject, html, and text.
	 */
	async renderTemplate(
		templateName: string,
		data: TemplateData,
		context?: {
			userId?: string;
			userAgent?: string;
			ipAddress?: string;
			sessionId?: string;
			requestId?: string;
		},
		locale: string = 'hu'
	): Promise<{ subject: string; html: string; text: string }> {
		const startTime = Date.now();

		try {
			// Try database first
			const databaseTemplate = await this.getDatabaseTemplate(templateName, locale);
			if (databaseTemplate) {
				const result = await this.renderDatabaseTemplate(databaseTemplate, data);

				const renderTime = Date.now() - startTime;
				if (this.databaseRepository instanceof DatabaseTemplateRepository) {
					await (this.databaseRepository as any).auditLogger?.logTemplateRendered(
						templateName as EmailTemplateType,
						data,
						{ ...context, renderTime, locale }
					);
				}

				return result;
			}

			// Check custom templates
			const customTemplate = this.customTemplates.get(templateName);
			if (customTemplate) {
				return await this.renderCustomTemplate(templateName, customTemplate, data);
			}

			throw new Error(`Template not found in database: ${templateName} (locale: ${locale})`);
		} catch (error) {
			this.log('error', 'Template rendering failed', {
				templateName,
				locale,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			if (this.databaseRepository instanceof DatabaseTemplateRepository) {
				await (this.databaseRepository as any).auditLogger?.logSecurityViolation(
					'template_rendering_failed',
					{
						templateName,
						locale,
						error: error instanceof Error ? error.message : 'Unknown error',
						renderTime: Date.now() - startTime
					},
					context
				);
			}

			throw error;
		}
	}

	/**
	 * Get template from database.
	 */
	private async getDatabaseTemplate(
		templateName: string,
		locale: string = 'hu'
	): Promise<DatabaseEmailTemplate | null> {
		try {
			if (this.isValidTemplateType(templateName)) {
				return await this.databaseRepository.getTemplateByType(
					templateName as EmailTemplateType,
					locale
				);
			}

			// Plugin template támogatás: 'appId:templateName' formátumú nevek
			// Ezek nem szerepelnek az EmailTemplateType enum-ban, de a DB-ben megtalálhatók
			if (templateName.includes(':')) {
				return await this.databaseRepository.getTemplateByType(
					templateName as EmailTemplateType,
					locale
				);
			}

			return null;
		} catch (error) {
			this.log('warn', 'Database template lookup failed', {
				templateName,
				locale,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return null;
		}
	}

	/**
	 * Render a database template.
	 */
	private async renderDatabaseTemplate(
		databaseTemplate: DatabaseEmailTemplate,
		data: TemplateData
	): Promise<{ subject: string; html: string; text: string }> {
		const engineTemplate: EmailTemplate = {
			subject: databaseTemplate.subjectTemplate,
			htmlTemplate: databaseTemplate.htmlTemplate,
			textTemplate: databaseTemplate.textTemplate,
			requiredData: databaseTemplate.requiredData,
			optionalData: databaseTemplate.optionalData || []
		};

		// Validate only required fields - optional fields are not validated
		this.validateTemplateDataForEngineTemplate(engineTemplate, data);

		const tempEngine = new TemplateEngine();
		tempEngine.registerTemplate(databaseTemplate.type as EmailTemplateType, engineTemplate);

		return await tempEngine.render(databaseTemplate.type as EmailTemplateType, data);
	}

	/**
	 * Render a custom template.
	 */
	private async renderCustomTemplate(
		templateName: string,
		customTemplate: EmailTemplate,
		data: TemplateData
	): Promise<{ subject: string; html: string; text: string }> {
		const tempEngine = new TemplateEngine();
		tempEngine.registerTemplate(templateName as EmailTemplateType, customTemplate);
		return await tempEngine.render(templateName as EmailTemplateType, data);
	}

	/**
	 * Validate template data against requirements.
	 */
	private validateTemplateDataForEngineTemplate(
		template: EmailTemplate,
		data: TemplateData
	): boolean {
		// Only validate required fields - optional fields are not required
		const missingFields = template.requiredData.filter(
			(field) => !(field in data) || data[field] === undefined || data[field] === null
		);

		if (missingFields.length > 0) {
			throw new Error(`Missing required template data: ${missingFields.join(', ')}`);
		}

		return true;
	}

	/**
	 * Get template information.
	 */
	async getTemplateInfo(templateName: string): Promise<{
		type: 'database' | 'custom';
		template: EmailTemplate | DatabaseEmailTemplate;
		parentTemplate?: string;
	} | null> {
		const databaseTemplate = await this.getDatabaseTemplate(templateName);
		if (databaseTemplate) {
			return { type: 'database', template: databaseTemplate };
		}

		const customTemplate = this.customTemplates.get(templateName);
		if (customTemplate) {
			return {
				type: 'custom',
				template: customTemplate,
				parentTemplate: this.templateInheritance.get(templateName)
			};
		}

		return null;
	}

	/**
	 * List all available templates.
	 */
	async listTemplates(): Promise<{
		database: string[];
		custom: string[];
	}> {
		let databaseTemplates: string[] = [];

		try {
			const dbTemplates = await this.databaseRepository.getAllActiveTemplates();
			databaseTemplates = dbTemplates.map((t) => t.type);
		} catch (error) {
			this.log('warn', 'Failed to list database templates', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		return {
			database: databaseTemplates,
			custom: Array.from(this.customTemplates.keys())
		};
	}

	/**
	 * Remove a custom template.
	 */
	removeCustomTemplate(name: string): boolean {
		const removed = this.customTemplates.delete(name);
		if (removed) {
			this.templateInheritance.delete(name);
			this.log('info', 'Custom template removed', { name });
		}
		return removed;
	}

	/**
	 * Validate template data for a specific template.
	 */
	async validateTemplateData(templateName: string, data: TemplateData): Promise<boolean> {
		const templateInfo = await this.getTemplateInfo(templateName);
		if (!templateInfo) {
			throw new Error(`Template not found: ${templateName}`);
		}

		let requiredData: string[];

		if (templateInfo.type === 'database') {
			const dbTemplate = templateInfo.template as DatabaseEmailTemplate;
			requiredData = dbTemplate.requiredData;
		} else {
			const engineTemplate = templateInfo.template as EmailTemplate;
			requiredData = engineTemplate.requiredData;
		}

		// Only validate required fields - optional fields are not required
		const missingFields = requiredData.filter(
			(field) => !(field in data) || data[field] === undefined || data[field] === null
		);

		if (missingFields.length > 0) {
			throw new Error(
				`Missing required template data for ${templateName}: ${missingFields.join(', ')}`
			);
		}

		return true;
	}

	/**
	 * Create a template preview with sample data.
	 */
	async createPreview(
		templateName: string,
		sampleData?: TemplateData
	): Promise<{ subject: string; html: string; text: string }> {
		const templateInfo = await this.getTemplateInfo(templateName);
		if (!templateInfo) {
			throw new Error(`Template not found: ${templateName}`);
		}

		const data = sampleData || this.generateSampleDataForTemplate(templateInfo);
		return await this.renderTemplate(templateName, data);
	}

	/**
	 * Check if a template name is a valid EmailTemplateType.
	 */
	private isValidTemplateType(templateName: string): boolean {
		return Object.values(EmailTemplateType).includes(templateName as EmailTemplateType);
	}

	/**
	 * Inherit properties from a parent template.
	 */
	private inheritFromTemplate(template: EmailTemplate, parentName: string): EmailTemplate {
		const parentTemplate = this.customTemplates.get(parentName);

		if (!parentTemplate) {
			throw new Error(`Parent template not found: ${parentName}`);
		}

		return {
			subject: template.subject || parentTemplate.subject,
			htmlTemplate: template.htmlTemplate || parentTemplate.htmlTemplate,
			textTemplate: template.textTemplate || parentTemplate.textTemplate,
			requiredData: [
				...parentTemplate.requiredData,
				...template.requiredData.filter((field) => !parentTemplate.requiredData.includes(field))
			],
			optionalData: [
				...(parentTemplate.optionalData || []),
				...(template.optionalData || []).filter(
					(field) => !(parentTemplate.optionalData || []).includes(field)
				)
			]
		};
	}

	/**
	 * Validate custom template structure.
	 */
	private validateCustomTemplate(template: EmailTemplate): void {
		if (!template.subject?.trim()) {
			throw new Error('Template subject cannot be empty');
		}
		if (!template.htmlTemplate?.trim()) {
			throw new Error('Template HTML content cannot be empty');
		}
		if (!template.textTemplate?.trim()) {
			throw new Error('Template text content cannot be empty');
		}
		if (!Array.isArray(template.requiredData)) {
			throw new Error('Template requiredData must be an array');
		}
	}

	/**
	 * Validate template name.
	 */
	private validateTemplateName(name: string): void {
		if (!name || typeof name !== 'string') {
			throw new Error('Template name must be a non-empty string');
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
			throw new Error('Template name can only contain letters, numbers, underscores, and hyphens');
		}
		if (this.customTemplates.has(name)) {
			throw new Error(`Custom template already exists: ${name}`);
		}
	}

	/**
	 * Generate sample data for template preview.
	 */
	private generateSampleDataForTemplate(templateInfo: {
		type: 'database' | 'custom';
		template: EmailTemplate | DatabaseEmailTemplate;
		parentTemplate?: string;
	}): TemplateData {
		const sampleData: TemplateData = {};
		let requiredData: string[];
		let optionalData: string[];

		if (templateInfo.type === 'database') {
			const dbTemplate = templateInfo.template as DatabaseEmailTemplate;
			requiredData = dbTemplate.requiredData;
			optionalData = dbTemplate.optionalData || [];
		} else {
			const engineTemplate = templateInfo.template as EmailTemplate;
			requiredData = engineTemplate.requiredData;
			optionalData = engineTemplate.optionalData || [];
		}

		requiredData.forEach((field) => {
			sampleData[field] = this.generateSampleValue(field);
		});

		optionalData.forEach((field) => {
			sampleData[field] = this.generateSampleValue(field);
		});

		return sampleData;
	}

	/**
	 * Generate sample value based on field name.
	 */
	private generateSampleValue(fieldName: string): string {
		const sampleValues: Record<string, string> = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			appName: 'MyApp',
			title: 'Sample Notification',
			message: 'This is a sample message for template preview.',
			resetLink: 'https://example.com/reset-password?token=sample-token',
			verificationUrl: 'https://example.com/verify?token=sample-token',
			dashboardUrl: 'https://example.com/dashboard',
			unsubscribeUrl: 'https://example.com/unsubscribe',
			actionUrl: 'https://example.com/action',
			actionText: 'Take Action',
			timestamp: new Date().toLocaleString(),
			expirationTime: '24 hours',
			otp: '123456',
			type: 'INFO',
			priority: 'normal',
			details: 'Additional details about this notification.'
		};

		return sampleValues[fieldName] || `Sample ${fieldName}`;
	}

	/**
	 * Invalidate template cache.
	 */
	async invalidateCache(templateType?: EmailTemplateType): Promise<void> {
		try {
			await this.databaseRepository.invalidateCache(templateType);
			this.log('info', 'Template cache invalidated', { templateType });
		} catch (error) {
			this.log('error', 'Failed to invalidate template cache', {
				templateType,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Refresh all template caches.
	 */
	async refreshCache(): Promise<void> {
		try {
			await this.databaseRepository.refreshCache();
			this.log('info', 'Template cache refreshed');
		} catch (error) {
			this.log('error', 'Failed to refresh template cache', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Get multiple templates by types.
	 */
	async getTemplatesByTypes(
		types: EmailTemplateType[]
	): Promise<Map<EmailTemplateType, DatabaseEmailTemplate>> {
		try {
			return await this.databaseRepository.getTemplatesByTypes(types);
		} catch (error) {
			this.log('error', 'Failed to get templates by types', {
				types,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return new Map();
		}
	}

	/**
	 * Check if database is available.
	 */
	async isDatabaseAvailable(): Promise<boolean> {
		try {
			await this.databaseRepository.getAllActiveTemplates();
			return true;
		} catch (error) {
			this.log('warn', 'Database repository not available', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return false;
		}
	}

	/**
	 * Get database repository instance.
	 */
	getDatabaseRepository(): IDatabaseTemplateRepository {
		return this.databaseRepository;
	}

	/**
	 * Logging utility.
	 */
	private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
		const timestamp = new Date().toISOString();
		const logData = data ? ` ${JSON.stringify(data)}` : '';
		console[level](`[${timestamp}] [TemplateRegistry] ${message}${logData}`);
	}
}
