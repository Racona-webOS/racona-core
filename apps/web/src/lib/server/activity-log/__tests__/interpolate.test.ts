import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { interpolate } from '../interpolate';

describe('interpolate', () => {
	// Unit tesztek
	it('behelyettesíti az egyszerű helyőrzőt', () => {
		expect(interpolate('{{username}} bejelentkezett', { username: 'admin' })).toBe(
			'admin bejelentkezett'
		);
	});

	it('több helyőrzőt is behelyettesít', () => {
		expect(interpolate('{{a}} és {{b}}', { a: 'első', b: 'második' })).toBe('első és második');
	});

	it('ismeretlen kulcs esetén a helyőrző változatlan marad', () => {
		expect(interpolate('{{ismeretlen}} szöveg', {})).toBe('{{ismeretlen}} szöveg');
	});

	it('üres sablon esetén üres stringet ad vissza', () => {
		expect(interpolate('', { key: 'érték' })).toBe('');
	});

	it('üres kontextus esetén a sablon változatlan marad', () => {
		expect(interpolate('{{a}} {{b}}', {})).toBe('{{a}} {{b}}');
	});

	it('numerikus értékeket is stringgé alakít', () => {
		expect(interpolate('{{count}} elem', { count: 42 })).toBe('42 elem');
	});

	// Property-based teszt
	// Feature: activity-log, Property 5: Kontextus interpoláció helyessége
	// Validates: Requirements 6.3
	it('5. tulajdonság: Kontextus interpoláció helyessége', () => {
		// A kulcsok csak szókarakter-kompatibilis azonosítók lehetnek (\w+),
		// mivel a {{kulcs}} helyőrző formátum csak ilyen kulcsokat támogat.
		const identifierArb = fc.stringMatching(/^\w+$/);
		fc.assert(
			fc.property(fc.dictionary(identifierArb, fc.string()), (context) => {
				const template = Object.keys(context)
					.map((k) => `{{${k}}}`)
					.join(' ');
				const result = interpolate(template, context);
				return Object.values(context).every((v) => result.includes(v));
			}),
			{ numRuns: 100 }
		);
	});
});
