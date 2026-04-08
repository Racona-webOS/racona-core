import { command } from '$app/server';
import { getEmailManager } from '$lib/server/utils';
import { EmailTemplateType } from '$lib/server/email/types';
import * as v from 'valibot';

// Request validation schema
const welcomeEmailSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	email: v.pipe(v.string(), v.email('Invalid email address')),
	userId: v.optional(v.string())
});

/**
 * Sends a welcome email to a newly registered user.
 * @param name - The name of the user.
 * @param email - The email address of the user.
 * @param userId - The user ID (optional).
 * @returns A promise that resolves with the result of sending the email.
 */
export const sendWelcomeEmail = command(welcomeEmailSchema, async ({ name, email, userId }) => {
	// Get email manager instance
	const emailManager = getEmailManager();

	// Check if email service is available
	if (!emailManager) {
		console.error('Email service not available');
		throw new Error('Email service is currently unavailable');
	}

	// Prepare template data for welcome email
	const { config } = await import('$lib/config');
	const baseUrl = config.APP_URL || 'http://localhost:3000';
	const templateData = {
		name,
		email,
		appName: config.APP_NAME || 'Desktop Environment',
		dashboardUrl: `${baseUrl}/`,
		userId: userId || undefined
	};

	// Send welcome email using template
	const result = await emailManager.sendTemplatedEmail({
		to: email,
		template: EmailTemplateType.WELCOME,
		data: templateData
	});

	if (result.success) {
		return {
			success: true,
			messageId: result.messageId,
			message: 'Welcome email sent successfully'
		};
	} else {
		console.error(`Failed to send welcome email to ${email}:`, result.error);
		throw new Error(result.error || 'Failed to send welcome email');
	}
});
