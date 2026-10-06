import { describe, it, expect } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { resolveShellInfo } from '../shell';

const PHONE =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const DESKTOP =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

function cookies(value?: string): Cookies {
	return { get: (name: string) => (name === 'racona_shell' ? value : undefined) } as Cookies;
}

describe('resolveShellInfo', () => {
	it('süti nélkül az eszköz dönt', () => {
		expect(resolveShellInfo(cookies(), PHONE)).toEqual({ mode: 'mobile', deviceType: 'mobile' });
		expect(resolveShellInfo(cookies(), DESKTOP)).toEqual({ mode: 'desktop', deviceType: 'desktop' });
	});

	it('a kézi választás felülírja az eszközt', () => {
		expect(resolveShellInfo(cookies('desktop'), PHONE)).toEqual({
			mode: 'desktop',
			deviceType: 'mobile'
		});
		expect(resolveShellInfo(cookies('mobile'), DESKTOP)).toEqual({
			mode: 'mobile',
			deviceType: 'desktop'
		});
	});

	it('érvénytelen sütiérték esetén az eszköz dönt', () => {
		expect(resolveShellInfo(cookies('tablet'), PHONE).mode).toBe('mobile');
	});
});
