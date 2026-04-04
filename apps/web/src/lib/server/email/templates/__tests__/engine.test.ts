import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../engine';
import type { EmailTemplateType } from '../types';

describe('TemplateEngine - Optional Data Handling', () => {
	it('should render template with all required data provided', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('welcome' as EmailTemplateType, {
			subject: 'Welcome {{name}}',
			htmlTemplate: '<p>Hello {{name}}, welcome to {{appName}}!</p>',
			textTemplate: 'Hello {{name}}, welcome to {{appName}}!',
			requiredData: ['name', 'appName'],
			optionalData: ['company']
		});

		const result = await engine.render('welcome' as EmailTemplateType, {
			name: 'John',
			appName: 'MyApp'
		});

		expect(result.subject).toBe('Welcome John');
		expect(result.html).toContain('Hello John, welcome to MyApp!');
		expect(result.text).toBe('Hello John, welcome to MyApp!');
	});

	it('should remove optional placeholders when data is not provided', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('notification' as EmailTemplateType, {
			subject: 'Notification',
			htmlTemplate: '<p>Message: {{message}}</p>{{company}}',
			textTemplate: 'Message: {{message}}\n{{company}}',
			requiredData: ['message'],
			optionalData: ['company']
		});

		const result = await engine.render('notification' as EmailTemplateType, {
			message: 'Important update'
		});

		expect(result.html).toContain('Message: Important update');
		expect(result.html).not.toContain('{{company}}');
		expect(result.text).toContain('Message: Important update');
		expect(result.text).not.toContain('{{company}}');
	});

	it('should keep optional placeholders when data is provided', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('notification' as EmailTemplateType, {
			subject: 'Notification',
			htmlTemplate: '<p>Message: {{message}}</p><p>Company: {{company}}</p>',
			textTemplate: 'Message: {{message}}\nCompany: {{company}}',
			requiredData: ['message'],
			optionalData: ['company']
		});

		const result = await engine.render('notification' as EmailTemplateType, {
			message: 'Important update',
			company: 'Acme Corp'
		});

		expect(result.html).toContain('Message: Important update');
		expect(result.html).toContain('Company: Acme Corp');
		expect(result.text).toContain('Message: Important update');
		expect(result.text).toContain('Company: Acme Corp');
	});

	it('should throw error when required data is missing', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('welcome' as EmailTemplateType, {
			subject: 'Welcome {{name}}',
			htmlTemplate: '<p>Hello {{name}}</p>',
			textTemplate: 'Hello {{name}}',
			requiredData: ['name'],
			optionalData: []
		});

		await expect(engine.render('welcome' as EmailTemplateType, {})).rejects.toThrow(
			'Missing required template data: name'
		);
	});

	it('should handle multiple optional fields', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('email' as EmailTemplateType, {
			subject: 'Hello {{name}}',
			htmlTemplate: '<p>Hi {{name}}</p>{{phone}}{{address}}',
			textTemplate: 'Hi {{name}}\n{{phone}}\n{{address}}',
			requiredData: ['name'],
			optionalData: ['phone', 'address']
		});

		const result = await engine.render('email' as EmailTemplateType, {
			name: 'Jane',
			phone: 'Phone: 123-456-7890'
		});

		expect(result.html).toContain('Hi Jane');
		expect(result.html).toContain('Phone: 123-456-7890');
		expect(result.html).not.toContain('{{address}}');
	});

	it('should sanitize content after rendering', async () => {
		const engine = new TemplateEngine();

		engine.registerTemplate('test' as EmailTemplateType, {
			subject: 'Test {{name}}',
			htmlTemplate: '<p>Hello {{name}}</p><script>alert("xss")</script>',
			textTemplate: 'Hello {{name}}',
			requiredData: ['name'],
			optionalData: []
		});

		const result = await engine.render('test' as EmailTemplateType, {
			name: 'John'
		});

		expect(result.html).not.toContain('<script>');
		expect(result.html).not.toContain('alert');
	});
});
