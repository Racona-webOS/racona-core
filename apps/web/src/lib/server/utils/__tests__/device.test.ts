import { describe, it, expect } from 'vitest';
import { classifyDevice } from '../device';

const UA = {
	iphoneSafari:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
	androidChrome:
		'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
	androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
	samsungBrowser:
		'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
	androidTablet:
		'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
	androidFirefoxTablet: 'Mozilla/5.0 (Android 14; Tablet; rv:131.0) Gecko/131.0 Firefox/131.0',
	ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
	macChrome:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
	windowsEdge:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
	linuxFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
};

describe('classifyDevice', () => {
	it.each([
		['iPhone Safari', UA.iphoneSafari],
		['Android Chrome', UA.androidChrome],
		['Android Firefox', UA.androidFirefox],
		['Samsung Internet', UA.samsungBrowser]
	])('telefon → mobile (%s)', (_name, ua) => {
		expect(classifyDevice(ua)).toBe('mobile');
	});

	it.each([
		['Android táblagép', UA.androidTablet],
		['Android Firefox táblagép', UA.androidFirefoxTablet],
		['iPad (Mac-nek mutatja magát)', UA.ipad],
		['Mac Chrome', UA.macChrome],
		['Windows Edge', UA.windowsEdge],
		['Linux Firefox', UA.linuxFirefox]
	])('asztali vagy táblagép → desktop (%s)', (_name, ua) => {
		expect(classifyDevice(ua)).toBe('desktop');
	});

	it('hiányzó azonosító → desktop', () => {
		expect(classifyDevice(null)).toBe('desktop');
		expect(classifyDevice(undefined)).toBe('desktop');
		expect(classifyDevice('')).toBe('desktop');
	});
});
