import { env } from '$lib/env';
import type { EmailConfig } from './types';

/**
 * Configuration validation result.
 */
export interface ConfigValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	recommendations: string[];
	environment: string;
}

/**
 * Email configuration validator with environment-specific checks.
 */
export class EmailConfigValidator {
	/**
	 * Validate email configuration comprehensively.
	 */
	static validate(): ConfigValidationResult {
		const result: ConfigValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
			recommendations: [],
			environment: env.NODE_ENV || 'development'
		};

		try {
			// Create configuration
			const config = this.createEmailConfig();

			// Validate provider-specific configuration
			this.validateProviderConfig(config, result);

			// Validate common configuration
			this.validateCommonConfig(config, result);

			// Environment-specific validation
			this.validateEnvironmentConfig(config, result);

			// Security validation
			this.validateSecurityConfig(config, result);

			// Set overall validity
			result.valid = result.errors.length === 0;

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Configuration creation failed';
			result.valid = false;
			result.errors.push(`Configuration validation failed: ${errorMessage}`);
			return result;
		}
	}

	/**
	 * Validate provider-specific configuration.
	 */
	private static validateProviderConfig(config: EmailConfig, result: ConfigValidationResult): void {
		const provider = env.EMAIL_PROVIDER || 'resend';

		switch (provider) {
			case 'resend':
				this.validateResendConfig(config, result);
				break;
			case 'smtp':
				this.validateSmtpConfig(config, result);
				break;
			default:
				result.errors.push(`Unsupported email provider: ${provider}`);
		}
	}

	/**
	 * Validate Resend configuration.
	 */
	private static validateResendConfig(config: EmailConfig, result: ConfigValidationResult): void {
		// API Key validation
		if (!config.apiKey) {
			result.errors.push('RESEND_API_KEY is required for Resend provider');
		} else {
			if (!config.apiKey.startsWith('re_')) {
				result.errors.push('RESEND_API_KEY appears to be invalid (should start with "re_")');
			}

			if (config.apiKey.length < 20) {
				result.warnings.push('RESEND_API_KEY appears to be too short');
			}
		}

		// From email validation
		if (!config.fromEmail) {
			result.errors.push('RESEND_FROM_EMAIL is required for Resend provider');
		}

		// Webhook secret validation
		if (!config.webhookSecret) {
			result.recommendations.push('Consider setting RESEND_WEBHOOK_SECRET for delivery tracking');
		}
	}

	/**
	 * Validate SMTP configuration.
	 */
	private static validateSmtpConfig(config: EmailConfig, result: ConfigValidationResult): void {
		// Required SMTP settings
		const requiredSmtpVars = [
			{ key: 'SMTP_HOST', name: 'SMTP host' },
			{ key: 'SMTP_PORT', name: 'SMTP port' },
			{ key: 'SMTP_USERNAME', name: 'SMTP username' },
			{ key: 'SMTP_PASSWORD', name: 'SMTP password' }
		];

		for (const { key, name } of requiredSmtpVars) {
			if (!env[key as keyof typeof env]) {
				result.errors.push(`${key} is required for SMTP provider (${name})`);
			}
		}

		// Port validation
		const port = env.SMTP_PORT;
		if (port) {
			const portNum = parseInt(String(port), 10);
			if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
				result.errors.push('SMTP_PORT must be a valid port number (1-65535)');
			}
		}

		// Security validation
		const secure = env.SMTP_SECURE;
		if (
			secure !== undefined &&
			typeof secure !== 'boolean' &&
			!['true', 'false'].includes(String(secure).toLowerCase())
		) {
			result.warnings.push('SMTP_SECURE should be "true" or "false"');
		}
	}

	/**
	 * Validate common configuration.
	 */
	private static validateCommonConfig(config: EmailConfig, result: ConfigValidationResult): void {
		// From email format validation
		if (config.fromEmail && !this.isValidEmail(config.fromEmail)) {
			result.errors.push('FROM_EMAIL must be a valid email address format');
		}

		// Log level validation
		const validLogLevels = ['debug', 'info', 'warn', 'error'];
		if (!validLogLevels.includes(config.logLevel)) {
			result.errors.push(`EMAIL_LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
		}

		// Retry configuration validation
		if (config.retryAttempts < 0 || config.retryAttempts > 10) {
			result.warnings.push('Retry attempts should be between 0 and 10');
		}

		if (config.retryDelay < 100 || config.retryDelay > 30000) {
			result.warnings.push('Retry delay should be between 100ms and 30 seconds');
		}
	}

	/**
	 * Validate environment-specific configuration.
	 */
	private static validateEnvironmentConfig(
		config: EmailConfig,
		result: ConfigValidationResult
	): void {
		const environment = result.environment;

		switch (environment) {
			case 'development':
				this.validateDevelopmentConfig(config, result);
				break;
			case 'production':
				this.validateProductionConfig(config, result);
				break;
			case 'test':
				this.validateTestConfig(config, result);
				break;
			default:
				result.warnings.push(`Unknown environment: ${environment}`);
		}
	}

	/**
	 * Validate development environment configuration.
	 */
	private static validateDevelopmentConfig(
		config: EmailConfig,
		result: ConfigValidationResult
	): void {
		if (!config.testMode) {
			result.warnings.push(
				'Consider enabling EMAIL_TEST_MODE=true in development to avoid sending real emails'
			);
		}

		if (config.logLevel !== 'debug') {
			result.recommendations.push(
				'Consider setting EMAIL_LOG_LEVEL=debug for detailed logging in development'
			);
		}

		result.recommendations.push(
			'Ensure you have proper email credentials configured for development testing'
		);
	}

	/**
	 * Validate production environment configuration.
	 */
	private static validateProductionConfig(
		config: EmailConfig,
		result: ConfigValidationResult
	): void {
		if (config.testMode) {
			result.errors.push('EMAIL_TEST_MODE should not be enabled in production');
		}

		if (config.logLevel === 'debug') {
			result.warnings.push(
				'Debug logging is enabled in production - consider changing to "info" or "warn"'
			);
		}

		if (!config.webhookSecret && env.EMAIL_PROVIDER === 'resend') {
			result.warnings.push(
				'RESEND_WEBHOOK_SECRET is not configured - delivery tracking will be limited'
			);
		}

		result.recommendations.push(
			'Ensure proper monitoring and alerting is configured for email service'
		);
		result.recommendations.push('Consider setting up email delivery webhooks for tracking');
	}

	/**
	 * Validate test environment configuration.
	 */
	private static validateTestConfig(config: EmailConfig, result: ConfigValidationResult): void {
		if (!config.testMode) {
			result.recommendations.push('Consider enabling EMAIL_TEST_MODE=true in test environment');
		}

		result.recommendations.push('Ensure test environment uses mock email providers when possible');
	}

	/**
	 * Validate security-related configuration.
	 */
	private static validateSecurityConfig(config: EmailConfig, result: ConfigValidationResult): void {
		// API key security
		if (config.apiKey) {
			if (config.apiKey.includes(' ')) {
				result.errors.push('API key contains spaces - check for configuration errors');
			}

			if (config.apiKey.length < 10) {
				result.warnings.push('API key appears to be too short - verify it is correct');
			}
		}

		// From email domain validation
		if (config.fromEmail) {
			const domain = config.fromEmail.split('@')[1];
			if (domain) {
				if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
					result.warnings.push('From email uses localhost domain - this may cause delivery issues');
				}

				if (domain.includes('example.com') || domain.includes('test.com')) {
					result.warnings.push('From email uses example/test domain - ensure this is intentional');
				}
			}
		}

		// Environment variable exposure
		const sensitiveVars = ['RESEND_API_KEY', 'SMTP_PASSWORD', 'RESEND_WEBHOOK_SECRET'];
		for (const varName of sensitiveVars) {
			const value = env[varName as keyof typeof env];
			if (value && typeof value === 'string') {
				if (value.startsWith('${') || value.includes('$')) {
					result.warnings.push(
						`${varName} appears to contain variable substitution - ensure it resolves correctly`
					);
				}
			}
		}
	}

	/**
	 * Create email configuration from environment.
	 */
	private static createEmailConfig(): EmailConfig {
		const provider = env.EMAIL_PROVIDER || 'resend';

		const baseConfig = {
			testMode: env.EMAIL_TEST_MODE || false,
			logLevel: env.EMAIL_LOG_LEVEL || (env.NODE_ENV === 'development' ? 'debug' : 'info'),
			retryAttempts: 3,
			retryDelay: 1000
		};

		switch (provider) {
			case 'resend':
				return {
					...baseConfig,
					apiKey: env.RESEND_API_KEY || '',
					fromEmail: env.RESEND_FROM_EMAIL || '',
					webhookSecret: env.RESEND_WEBHOOK_SECRET
				};

			case 'smtp':
				return {
					...baseConfig,
					apiKey: '',
					fromEmail: env.SMTP_USERNAME || '',
					webhookSecret: undefined
				};

			default:
				throw new Error(`Unsupported email provider: ${provider}`);
		}
	}

	/**
	 * Validate email format.
	 */
	private static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}

/**
 * Quick configuration validation function.
 */
export function validateEmailConfiguration(): ConfigValidationResult {
	return EmailConfigValidator.validate();
}
