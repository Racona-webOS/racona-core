import type { Transporter } from 'nodemailer';
import type { EmailProviderClient, SMTPConfig } from './factory';
import type { ResendEmailPayload } from '../types';
import { createSMTPTransporter } from './nodemailer-wrapper';

export class SMTPClient implements EmailProviderClient {
	private transporter: Transporter | null = null;
	private config: SMTPConfig;

	constructor(config: SMTPConfig) {
		this.config = config;
		this.initializeTransporter();
	}

	private async initializeTransporter() {
		try {
			console.log('Initializing SMTP transporter with config:', {
				host: this.config.host,
				port: this.config.port,
				secure: this.config.secure,
				username: this.config.username,
				passwordSet: !!this.config.password
			});

			this.transporter = await createSMTPTransporter(this.config);
			console.log('✅ SMTP transporter initialized successfully');
		} catch (error) {
			console.error('❌ Failed to initialize SMTP transporter:', error);
			throw error;
		}
	}

	async send(payload: ResendEmailPayload): Promise<{ id: string }> {
		try {
			// Ensure transporter is initialized
			if (!this.transporter) {
				await this.initializeTransporter();
			}

			if (!this.transporter) {
				throw new Error('SMTP transporter not initialized');
			}

			console.log('Sending SMTP email:', {
				from: payload.from,
				to: payload.to,
				subject: payload.subject,
				host: this.config.host
			});

			const mailOptions = {
				from: payload.from,
				to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
				subject: payload.subject,
				text: payload.text,
				html: payload.html,
				replyTo: payload.reply_to,
				// Handle attachments if present
				...(payload.attachments &&
					payload.attachments.length > 0 && {
						attachments: payload.attachments.map((att) => ({
							filename: att.filename,
							content: att.content,
							contentType: att.content_type
						}))
					})
			};

			const result = await this.transporter.sendMail(mailOptions);
			return {
				id: result.messageId || `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
			};
		} catch (error) {
			console.error('SMTP send error:', error);
			throw error;
		}
	}

	async validateApiKey(): Promise<boolean> {
		try {
			// Ensure transporter is initialized
			if (!this.transporter) {
				await this.initializeTransporter();
			}

			if (!this.transporter) {
				throw new Error('SMTP transporter not initialized');
			}

			console.log('Validating SMTP connection...');
			await this.transporter.verify();
			console.log('SMTP connection validated successfully');
			return true;
		} catch (error) {
			console.error('SMTP validation failed:', error);
			return false;
		}
	}

	/**
	 * Close the SMTP connection
	 */
	async close(): Promise<void> {
		if (this.transporter) {
			this.transporter.close();
		}
	}
}
