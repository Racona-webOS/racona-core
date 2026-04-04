import { describe, it, expect } from 'vitest';
import { validateName, validateUsername } from '../profile-validation';

describe('validateName', () => {
	it('should accept valid names', () => {
		expect(validateName('John Doe')).toEqual({ valid: true });
		expect(validateName('Jane')).toEqual({ valid: true });
		expect(validateName('A')).toEqual({ valid: true });
	});

	it('should reject empty strings', () => {
		const result = validateName('');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A név megadása kötelező');
	});

	it('should reject whitespace-only strings', () => {
		const result = validateName('   ');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A név megadása kötelező');
	});

	it('should reject names longer than 100 characters', () => {
		const longName = 'a'.repeat(101);
		const result = validateName(longName);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A név maximum 100 karakter lehet');
	});
});

describe('validateUsername', () => {
	it('should accept valid usernames', () => {
		expect(validateUsername('john_doe')).toEqual({ valid: true });
		expect(validateUsername('user123')).toEqual({ valid: true });
		expect(validateUsername('abc')).toEqual({ valid: true });
	});

	it('should accept empty username (optional field)', () => {
		expect(validateUsername('')).toEqual({ valid: true });
	});

	it('should reject usernames with special characters', () => {
		const result = validateUsername('user@name');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A felhasználónév csak betűket, számokat és aláhúzást tartalmazhat');
	});

	it('should reject usernames shorter than 3 characters', () => {
		const result = validateUsername('ab');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A felhasználónév minimum 3 karakter');
	});

	it('should reject usernames longer than 50 characters', () => {
		const longUsername = 'a'.repeat(51);
		const result = validateUsername(longUsername);
		expect(result.valid).toBe(false);
		expect(result.error).toBe('A felhasználónév maximum 50 karakter');
	});

	it('should accept username at boundary (3 characters)', () => {
		expect(validateUsername('abc')).toEqual({ valid: true });
	});

	it('should accept username at boundary (50 characters)', () => {
		const username = 'a'.repeat(50);
		expect(validateUsername(username)).toEqual({ valid: true });
	});
});
