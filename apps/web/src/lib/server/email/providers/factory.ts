import { ResendClient } from '../client';
import { SMTPClient } from './smtp';
import { env } from '$lib/env';
import type { EmailConfig } from '../types';

// Provider types
export type EmailProvider = 'resend' | 'sendgrid' | 'smtp' | 'ses';

// Provider interfaces
export interface EmailProviderClient {
	send(payload: any): Promise<{ id: string }>;
	validateApiKey?(): Promise<boolean>;
}

// SMTP Configuration
export interface SMTPConfig {
	host: string;
	port: number;
	secure: boolean;
	username: string;
	password: string;
}

// AWS SES Configuration
export interface SESConfig {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
}

/**
 * Factory for creating email provider clients
 */
export class EmailProviderFactory {
	static createClient(provider: EmailProvider, config: EmailConfig): EmailProviderClient {
		switch (provider) {
			case 'resend':
				return new ResendClient(config);

			case 'sendgrid':
				// Implement SendGrid client
				throw new Error('SendGrid provider not implemented yet');

			case 'smtp':
				const smtpConfig = ProviderConfigBuilder.buildSMTPConfig();
				return new SMTPClient(smtpConfig);

			case 'ses':
				// Implement AWS SES client
				throw new Error('AWS SES provider not implemented yet');

			default:
				throw new Error(`Unknown email provider: ${provider}`);
		}
	}

	/**
	 * Get the configured email provider from environment
	 */
	static getConfiguredProvider(): EmailProvider {
		return (env.EMAIL_PROVIDER as EmailProvider) || 'resend';
	}

	/**
	 * Create client based on environment configuration
	 */
	static createConfiguredClient(config: EmailConfig): EmailProviderClient {
		const provider = this.getConfiguredProvider();
		return this.createClient(provider, config);
	}
}

/**
 * Provider-specific configuration builders
 */
export class ProviderConfigBuilder {
	static buildResendConfig(): Partial<EmailConfig> {
		return {
			apiKey: env.RESEND_API_KEY,
			fromEmail: env.RESEND_FROM_EMAIL,
			webhookSecret: env.RESEND_WEBHOOK_SECRET
		};
	}

	static buildSendGridConfig(): Partial<EmailConfig> {
		return {
			apiKey: env.SENDGRID_API_KEY || '',
			fromEmail: env.SENDGRID_FROM_EMAIL || ''
		};
	}

	static buildSMTPConfig(): SMTPConfig {
		return {
			host: env.SMTP_HOST || 'localhost',
			port: parseInt(String(env.SMTP_PORT ?? '587')),
			secure: env.SMTP_SECURE === true || String(env.SMTP_SECURE) === 'true',
			username: env.SMTP_USERNAME || '',
			password: env.SMTP_PASSWORD || ''
		};
	}

	static buildSESConfig(): SESConfig {
		return {
			region: env.AWS_REGION || 'us-east-1',
			accessKeyId: env.AWS_ACCESS_KEY_ID || '',
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY || ''
		};
	}
}
