import { describe, it, expect } from 'vitest';
import { safeRedirectTarget, withRedirectTarget, DEFAULT_REDIRECT } from '../redirect';

describe('safeRedirectTarget', () => {
	it.each([
		['/admin', '/admin'],
		['/admin?app=racona-work&entry=worklog', '/admin?app=racona-work&entry=worklog'],
		['/admin/file-upload-test', '/admin/file-upload-test'],
		['/admin#reszlet', '/admin#reszlet']
	])('alkalmazáson belüli cím megmarad (%s)', (value, expected) => {
		expect(safeRedirectTarget(value)).toBe(expected);
	});

	it.each([
		['hiányzó', null],
		['üres', ''],
		['abszolút külső', 'https://gonosz.example/admin'],
		['protokoll-relatív', '//gonosz.example/admin'],
		['visszaper', '/\\gonosz.example'],
		['javascript', 'javascript:alert(1)'],
		['nem /admin alatti', '/api/auth/sign-out'],
		['/admin előtagú másik útvonal', '/adminisztracio'],
		['kilépés a /admin alól', '/admin/../api/x'],
		['belépőoldal', '/admin/sign-in?redirectTo=/admin'],
		['2FA oldal', '/admin/verify-2fa']
	])('elutasítva → /admin (%s)', (_name, value) => {
		expect(safeRedirectTarget(value)).toBe(DEFAULT_REDIRECT);
	});
});

describe('withRedirectTarget', () => {
	it('alapértelmezett célnál nem ír paramétert', () => {
		expect(withRedirectTarget('/admin/verify-2fa', '/admin')).toBe('/admin/verify-2fa');
	});

	it('egyéb célt kódolva továbbad', () => {
		expect(withRedirectTarget('/admin/sign-in', '/admin?app=racona-work&entry=month')).toBe(
			'/admin/sign-in?redirectTo=%2Fadmin%3Fapp%3Dracona-work%26entry%3Dmonth'
		);
	});
});
