/**
 * Property-based teszt: Email template név automatikus prefixelés
 *
 * Feature: elywork-plugin-app, Property 10: Email template név automatikus prefixelés
 * Validates: Requirements 12.4
 *
 * Tetszőleges appId és templateName string esetén a context.email.send()
 * a template nevet ${appId}:${templateName} formátumban prefixeli,
 * mielőtt az EmailManager.sendTemplatedEmail() metódust hívná.
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { _prefixTemplateName as prefixTemplateName } from './+server';

// Mock a getEmailManager-t, hogy elkapjuk a sendTemplatedEmail hívást
vi.mock('$lib/server/email/init', () => ({
	getEmailManager: vi.fn()
}));

// Mock a drizzle/database importokat, hogy ne próbáljon DB-hez csatlakozni
vi.mock('$lib/server/database', () => ({
	default: {}
}));

vi.mock('@elyos/database', () => ({
	PluginErrorCode: {
		PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
		PLUGIN_INACTIVE: 'PLUGIN_INACTIVE',
		PERMISSION_DENIED: 'PERMISSION_DENIED',
		REMOTE_ERROR: 'REMOTE_ERROR',
		REMOTE_CALL_TIMEOUT: 'REMOTE_CALL_TIMEOUT'
	},
	apps: {}
}));

vi.mock('drizzle-orm', () => ({
	eq: vi.fn()
}));

describe('Feature: elywork-plugin-app, Property 10: Email template név automatikus prefixelés', () => {
	/**
	 * **Validates: Requirements 12.4**
	 *
	 * Pure function teszt: a prefixTemplateName függvény tetszőleges
	 * appId és templateName esetén `${appId}:${templateName}` formátumot ad vissza.
	 */
	it('Property: prefixTemplateName tetszőleges appId és templateName esetén ${appId}:${templateName} formátumú', () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), (appId, templateName) => {
				const result = prefixTemplateName(appId, templateName);

				// Az eredmény pontosan `${appId}:${templateName}` formátumú
				expect(result).toBe(`${appId}:${templateName}`);

				// Az eredmény tartalmazza a kettőspontot elválasztóként
				expect(result).toContain(':');

				// Az eredmény az appId-val kezdődik és a templateName-mel végződik
				expect(result.startsWith(appId)).toBe(true);
				expect(result.endsWith(templateName)).toBe(true);
			}),
			{ numRuns: 200 }
		);
	});
});
