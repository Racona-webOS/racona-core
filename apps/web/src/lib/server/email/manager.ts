import { ResendClient } from './client';
import { EmailLogger } from './logger';
import { TemplateRegistry } from './templates/registry';
import { EmailProviderFactory } from './providers/factory';
import type { EmailProviderClient } from './providers/factory';
import { EmailDeliveryStatus, EmailTemplateType } from './types';
import type {
	SendEmailParams,
	TemplatedEmailParams,
	EmailResult,
	EmailConfig,
	ResendEmailPayload
} from './types';
import * as v from 'valibot';
import { env } from '$lib/env';
import { enrichTemplateDataWithBranding } from './utils/branding';

/**
 * Build EmailConfig from environment variables.
 */
function buildEmailConfig(): EmailConfig {
	const provider = env.EMAIL_PROVIDER || 'resend';
	const base = {
		testMode: env.EMAIL_TEST_MODE || false,
		logLevel: (env.EMAIL_LOG_LEVEL || 'info') as EmailConfig['logLevel'],
		retryAttempts: 3,
		retryDelay: 1000
	};
	if (provider === 'smtp') {
		return {
			...base,
			apiKey: '',
			fromEmail: env.SMTP_FROM_EMAIL || env.SMTP_USERNAME || '',
			fromName: env.SMTP_FROM_NAME || env.APP_NAME || undefined,
			replyTo: env.SMTP_REPLY_TO || env.SMTP_FROM_EMAIL || env.SMTP_USERNAME || undefined
		};
	}
	return {
		...base,
		apiKey: env.RESEND_API_KEY || '',
		fromEmail: env.RESEND_FROM_EMAIL || '',
		fromName: env.APP_NAME || undefined,
		replyTo: env.RESEND_FROM_EMAIL || undefined,
		webhookSecret: env.RESEND_WEBHOOK_SECRET
	};
}

/**
 * Email validation schemas
 */
const emailSchema = v.pipe(v.string(), v.email('Invalid email address format'));

const emailArraySchema = v.pipe(
	v.array(emailSchema),
	v.minLength(1, 'At least one recipient is required')
);

const sendEmailParamsSchema = v.object({
	to: v.union([emailSchema, emailArraySchema]),
	subject: v.pipe(v.string(), v.minLength(1, 'Subject is required')),
	html: v.optional(v.string()),
	text: v.optional(v.string()),
	from: v.optional(emailSchema),
	replyTo: v.optional(emailSchema),
	attachments: v.optional(
		v.array(
			v.object({
				filename: v.string(),
				content: v.union([v.string(), v.instance(Buffer)]),
				contentType: v.optional(v.string())
			})
		)
	)
});

const templatedEmailParamsSchema = v.object({
	to: v.union([emailSchema, emailArraySchema]),
	template: v.union([
		v.picklist(Object.values(EmailTemplateType) as [EmailTemplateType, ...EmailTemplateType[]]),
		v.pipe(v.string(), v.regex(/^[\w-]+:[\w-]+$/, 'Plugin template format: appId:templateName'))
	]),
	data: v.record(v.string(), v.unknown()),
	from: v.optional(emailSchema),
	replyTo: v.optional(emailSchema),
	locale: v.optional(v.string()),
	requestUrl: v.optional(v.string())
});

/**
 * Main email manager service
 */
export class EmailManager {
	private client: EmailProviderClient;
	private logger: EmailLogger;
	private templateRegistry: TemplateRegistry;
	private config: EmailConfig;

	constructor(
		client?: EmailProviderClient,
		logger?: EmailLogger,
		templateRegistry?: TemplateRegistry,
		config?: EmailConfig
	) {
		this.client =
			client || EmailProviderFactory.createConfiguredClient(config || ({} as EmailConfig));
		this.logger = logger || new EmailLogger();
		this.templateRegistry = templateRegistry || new TemplateRegistry();
		this.config = config || (this.client as any).getConfig?.() || buildEmailConfig();
	}

	/**
	 * Build the "From" address, optionally including a display name.
	 * Returns "Name <email>" if fromName is configured, otherwise just the email.
	 */
	private buildFromAddress(email?: string, name?: string): string {
		const addr = email || this.config.fromEmail;
		const displayName = name || this.config.fromName;
		return displayName ? `${displayName} <${addr}>` : addr;
	}

	/**
	 * Send a simple email
	 */
	async sendEmail(params: SendEmailParams): Promise<EmailResult> {
		try {
			// Validate input parameters
			const validatedParams = v.parse(sendEmailParamsSchema, params);

			this.log('info', 'Sending email', {
				to: validatedParams.to,
				subject: validatedParams.subject
			});

			// Ensure we have content
			if (!validatedParams.html && !validatedParams.text) {
				throw new Error('Either HTML or text content must be provided');
			}

			// Normalize recipients to array
			const recipients = Array.isArray(validatedParams.to)
				? validatedParams.to
				: [validatedParams.to];

			// Prepare Resend payload
			const payload: ResendEmailPayload = {
				from: validatedParams.from || this.buildFromAddress(),
				to: recipients,
				subject: validatedParams.subject,
				html: validatedParams.html,
				text: validatedParams.text,
				reply_to: validatedParams.replyTo || this.config.replyTo,
				attachments: validatedParams.attachments?.map((att) => ({
					filename: att.filename,
					content: att.content,
					content_type: att.contentType
				}))
			};

			// Log email attempt
			const logId = await this.logger.logEmailAttempt({
				recipient: recipients.join(', '),
				subject: validatedParams.subject,
				status: EmailDeliveryStatus.PENDING
			});

			try {
				// Send email in test mode or real mode
				if (this.config.testMode) {
					return await this.handleTestMode(payload, logId);
				}

				const response = await this.client.send(payload);

				// Update log with success
				await this.logger.updateEmailStatus(logId, EmailDeliveryStatus.SENT, response.id);

				this.log('info', 'Email sent successfully', {
					messageId: response.id,
					recipients
				});

				return {
					success: true,
					messageId: response.id
				};
			} catch (error) {
				// Update log with failure
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				await this.logger.updateEmailStatus(
					logId,
					EmailDeliveryStatus.FAILED,
					undefined,
					errorMessage
				);

				this.log('error', 'Email sending failed', {
					error: errorMessage,
					recipients
				});

				return {
					success: false,
					error: errorMessage
				};
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

			this.log('error', 'Email validation failed', {
				error: errorMessage,
				params
			});

			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Send a templated email using the template registry.
	 */
	async sendTemplatedEmail(params: TemplatedEmailParams): Promise<EmailResult> {
		try {
			// Validate input parameters
			const validatedParams = v.parse(templatedEmailParamsSchema, params);

			this.log('info', 'Sending templated email', {
				to: validatedParams.to,
				template: validatedParams.template,
				locale: params.locale || 'hu'
			});

			// Enrich template data with branding information (including dynamic URL)
			const enrichedData = enrichTemplateDataWithBranding(
				validatedParams.data,
				validatedParams.requestUrl
			);

			// Validate template data
			await this.templateRegistry.validateTemplateData(validatedParams.template, enrichedData);

			// Render the template with locale support
			const renderedContent = await this.templateRegistry.renderTemplate(
				validatedParams.template,
				enrichedData,
				undefined, // context
				params.locale || 'hu'
			);

			// Send the rendered email
			return await this.sendEmail({
				to: validatedParams.to,
				subject: renderedContent.subject,
				html: renderedContent.html,
				text: renderedContent.text,
				from: validatedParams.from,
				replyTo: validatedParams.replyTo
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown template error';

			this.log('error', 'Templated email failed', {
				error: errorMessage,
				template: params.template
			});

			return {
				success: false,
				error: errorMessage
			};
		}
	}

	/**
	 * Get email delivery status
	 */
	async getEmailStatus(messageId: string): Promise<EmailDeliveryStatus | null> {
		try {
			const logs = await this.logger.getEmailLogs({ messageId });
			return logs.length > 0 ? logs[0].status : null;
		} catch (error) {
			this.log('error', 'Failed to get email status', {
				messageId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return null;
		}
	}

	/**
	 * Register a custom email template.
	 */
	registerCustomTemplate(
		name: string,
		template: {
			subject: string;
			htmlTemplate: string;
			textTemplate: string;
			requiredData: string[];
			optionalData?: string[];
		},
		parentTemplate?: string
	): void {
		this.templateRegistry.registerCustomTemplate(name, template, parentTemplate);
		this.log('info', 'Custom template registered', { name, parentTemplate });
	}

	/**
	 * Get template preview with sample data.
	 */
	async getTemplatePreview(
		templateName: string,
		sampleData?: Record<string, unknown>
	): Promise<{
		subject: string;
		html: string;
		text: string;
	}> {
		return await this.templateRegistry.createPreview(templateName, sampleData);
	}

	/**
	 * List all available templates.
	 */
	async listTemplates(): Promise<{ database: string[]; custom: string[] }> {
		return await this.templateRegistry.listTemplates();
	}

	/**
	 * Validate email service configuration
	 */
	async validateConfiguration(): Promise<boolean> {
		try {
			this.log('info', 'Validating email configuration');

			const provider = env.EMAIL_PROVIDER || 'resend';

			// Check required configuration based on provider
			// SMTP doesn't use apiKey, it uses SMTP credentials
			const requiresApiKey = provider !== 'smtp';

			if (requiresApiKey && !this.config.apiKey) {
				this.log('error', 'Missing required API key', {
					provider,
					hasApiKey: !!this.config.apiKey
				});
				return false;
			}

			if (!this.config.fromEmail) {
				this.log('error', 'Missing required from email', {
					hasFromEmail: !!this.config.fromEmail
				});
				return false;
			}

			// Validate API key with Resend
			if (
				this.client &&
				'validateApiKey' in this.client &&
				typeof this.client.validateApiKey === 'function'
			) {
				try {
					const isValidApiKey = await this.client.validateApiKey();
					if (!isValidApiKey) {
						this.log('error', 'Invalid Resend API key');
						return false;
					}
				} catch (error) {
					this.log('error', 'Failed to validate API key', error);
					return false;
				}
			}

			// Validate from email format
			try {
				v.parse(emailSchema, this.config.fromEmail);
			} catch {
				this.log('error', 'Invalid from email format', {
					fromEmail: this.config.fromEmail
				});
				return false;
			}

			this.log('info', 'Email configuration is valid');
			return true;
		} catch (error) {
			this.log('error', 'Configuration validation failed', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			return false;
		}
	}

	/**
	 * Handle test mode email sending
	 */
	private async handleTestMode(payload: ResendEmailPayload, logId: string): Promise<EmailResult> {
		this.log('info', 'Test mode: Email captured instead of sent', {
			to: payload.to,
			subject: payload.subject
		});

		// In test mode, simulate successful sending
		const mockMessageId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Update log with test success
		await this.logger.updateEmailStatus(logId, EmailDeliveryStatus.SENT, mockMessageId);

		// Optionally save email to file or log for debugging
		if (this.config.logLevel === 'debug') {
			console.log('TEST EMAIL CONTENT:', {
				messageId: mockMessageId,
				from: payload.from,
				to: payload.to,
				subject: payload.subject,
				html: payload.html?.substring(0, 200) + '...',
				text: payload.text?.substring(0, 200) + '...'
			});
		}

		return {
			success: true,
			messageId: mockMessageId
		};
	}

	/**
	 * Logging utility
	 */
	private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
		const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
		const currentLevel = logLevels[this.config.logLevel];
		const messageLevel = logLevels[level];

		if (messageLevel >= currentLevel) {
			const timestamp = new Date().toISOString();
			const logData = data ? ` ${JSON.stringify(data)}` : '';
			console[level](`[${timestamp}] [EmailManager] ${message}${logData}`);
		}
	}
}
