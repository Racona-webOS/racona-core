/**
 * Property-Based Tests for Date-Based Log File Name Generation
 *
 * Feature: error-logging
 *
 * Property 5: Dátum alapú fájlnév generálás
 * _Bármely_ dátum esetén, a FileTransport által generált fájlnév megfelel az
 * `error-YYYY-MM-DD.log` mintának, ahol YYYY-MM-DD az adott dátum ISO formátumú
 * reprezentációja.
 *
 * **Validates: Requirements 2.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { join } from 'node:path';
import { getLogFilePath } from '../file.js';

const testConfig = { numRuns: 100 };

// ============================================================================
// Property tesztek
// ============================================================================

// Realistic date range generator (years 2000–2099), filtered to exclude invalid dates
const realisticDateArbitrary = fc
	.date({
		min: new Date('2000-01-01T00:00:00.000Z'),
		max: new Date('2099-12-31T23:59:59.999Z')
	})
	.filter((d) => !isNaN(d.getTime()));

describe('Feature: error-logging, Property 5: Dátum alapú fájlnév generálás', () => {
	it('for any date, the generated filename matches the error-YYYY-MM-DD.log pattern with correct date components', () => {
		fc.assert(
			fc.property(
				realisticDateArbitrary,
				fc.string({ minLength: 1 }),
				(date: Date, logDir: string) => {
					const filePath = getLogFilePath(logDir, date);

					const yyyy = date.getFullYear();
					const mm = String(date.getMonth() + 1).padStart(2, '0');
					const dd = String(date.getDate()).padStart(2, '0');
					const expectedFileName = `error-${yyyy}-${mm}-${dd}.log`;
					const expectedPath = join(logDir, expectedFileName);

					// The full path must match
					expect(filePath).toBe(expectedPath);

					// The filename portion must match the pattern
					const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop();
					expect(fileName).toMatch(/^error-\d{4}-\d{2}-\d{2}\.log$/);
				}
			),
			testConfig
		);
	});
});
