/**
 * A manifest `mobile` mezőjének ellenőrzése (mobil bejegyzések).
 */

import { describe, it, expect } from 'vitest';
import {
	ManifestValidator,
	MAX_MOBILE_ENTRIES
} from '$lib/server/plugins/validation/ManifestValidator';

const validator = new ManifestValidator();

function entry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'leave',
		label: { hu: 'Szabadság igénylése', en: 'Request leave' },
		icon: 'CalendarPlus',
		component: 'MobileLeaveRequest',
		...overrides
	};
}

function manifest(mobile: unknown) {
	return {
		id: 'demo-plugin',
		name: 'Demo',
		version: '1.0.0',
		description: 'Demo plugin',
		author: 'Racona',
		entry: 'dist/index.js',
		icon: 'icon.svg',
		permissions: ['database'],
		mobile
	};
}

describe('ManifestValidator — mobile', () => {
	it('accepts entries and keeps them in the output', () => {
		const result = validator.validate(
			manifest({
				entries: [
					entry(),
					entry({ id: 'worklog', label: 'Munkanapló', component: 'MobileWorkLog' })
				]
			})
		);
		expect(result.errors).toEqual([]);
		expect(result.manifest?.mobile?.entries).toHaveLength(2);
		expect(result.manifest?.mobile?.entries[0]).toMatchObject({
			id: 'leave',
			component: 'MobileLeaveRequest'
		});
	});

	it('accepts an empty entry list (the whole app opens on mobile)', () => {
		expect(validator.validate(manifest({ entries: [] })).valid).toBe(true);
	});

	it('is optional', () => {
		expect(validator.validate(manifest(undefined)).valid).toBe(true);
	});

	it('rejects a non kebab-case entry ID', () => {
		expect(validator.validate(manifest({ entries: [entry({ id: 'Leave Request' })] })).valid).toBe(
			false
		);
	});

	it('rejects a missing component', () => {
		expect(validator.validate(manifest({ entries: [entry({ component: '' })] })).valid).toBe(false);
	});

	it('rejects duplicate entry IDs', () => {
		const result = validator.validate(manifest({ entries: [entry(), entry()] }));
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.field === 'mobile.entries.1.id')).toBe(true);
	});

	it('limits the number of entries', () => {
		const entries = Array.from({ length: MAX_MOBILE_ENTRIES + 1 }, (_, i) =>
			entry({ id: `e-${i}` })
		);
		expect(validator.validate(manifest({ entries })).valid).toBe(false);
	});
});
