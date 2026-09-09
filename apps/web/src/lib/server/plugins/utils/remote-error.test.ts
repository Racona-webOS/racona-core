/**
 * Remote hiba szűrés: a belső hibák részletei nem juthatnak ki a felületre,
 * a pluginok szándékos üzenetei viszont igen.
 */

import { describe, it, expect } from 'vitest';
import { isInternalError, toClientError, GENERIC_REMOTE_ERROR_MESSAGE } from './remote-error';

/**
 * pg DatabaseError-szerű objektum (a pg csomag ilyen mezőkkel dob).
 *
 * @param message - A hiba szövege.
 * @param code - SQLSTATE kód.
 * @param extra - További pg mezők (table, constraint stb.).
 * @returns A teszthez használt hiba objektum.
 */
function pgError(message: string, code: string, extra: Record<string, unknown> = {}) {
	return Object.assign(new Error(message), { severity: 'ERROR', code, ...extra });
}

describe('isInternalError', () => {
	it('adatbázis hibát belsőnek tekint', () => {
		expect(isInternalError(pgError('column "employee_id" does not exist', '42703'))).toBe(true);
		expect(
			isInternalError(
				pgError('duplicate key value violates unique constraint', '23505', {
					table: 'employees',
					constraint: 'employees_user_id_organization_id_key'
				})
			)
		).toBe(true);
	});

	it('kapcsolati hibát belsőnek tekint', () => {
		expect(isInternalError(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }))).toBe(true);
	});

	it('JS programhibát belsőnek tekint', () => {
		expect(isInternalError(new TypeError("Cannot read properties of undefined (reading 'rows')"))).toBe(true);
	});

	it('a plugin szándékos üzenetét nem tekinti belsőnek', () => {
		expect(isInternalError(new Error('Érvénytelen szervezet azonosító'))).toBe(false);
		expect(isInternalError(new Error('Nincs elég szabadságkeret'))).toBe(false);
	});

	it('nem objektum hibára hamis', () => {
		expect(isInternalError('boom')).toBe(false);
		expect(isInternalError(null)).toBe(false);
		expect(isInternalError(undefined)).toBe(false);
	});
});

describe('toClientError', () => {
	it('adatbázis hiba szövegét nem adja tovább', () => {
		const result = toClientError(pgError('column "employee_id" does not exist', '42703'));

		expect(result.internal).toBe(true);
		expect(result.message).not.toContain('employee_id');
		expect(result.message).not.toContain('column');
		expect(result.message).toContain(GENERIC_REMOTE_ERROR_MESSAGE);
		expect(result.reference).toMatch(/^[0-9a-f]{8}$/);
		expect(result.message).toContain(result.reference!);
	});

	it('séma- és constraint neveket sem szivárogtat', () => {
		const result = toClientError(
			pgError('relation "app__racona_work.employees" does not exist', '42P01')
		);

		expect(result.message).not.toContain('app__racona_work');
		expect(result.message).not.toContain('employees');
	});

	it('a plugin üzenetét változatlanul továbbadja', () => {
		const result = toClientError(new Error('Érvénytelen szervezet azonosító'));

		expect(result.internal).toBe(false);
		expect(result.message).toBe('Érvénytelen szervezet azonosító');
		expect(result.reference).toBeUndefined();
	});

	it('ismeretlen dobott érték esetén általános üzenet', () => {
		expect(toClientError({ nope: true })).toEqual({
			message: 'Remote function execution failed',
			internal: false
		});
	});

	it('hívásonként külön hivatkozási azonosítót ad', () => {
		const a = toClientError(pgError('boom', '42703'));
		const b = toClientError(pgError('boom', '42703'));

		expect(a.reference).not.toBe(b.reference);
	});
});
