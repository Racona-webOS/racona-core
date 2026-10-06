import { describe, it, expect } from 'vitest';
import { canOpenOnMobile } from '../mobileNavigation';
import type { AppMetadata } from '$lib/types/window';

const base: AppMetadata = { appName: 'x', title: 'X', defaultSize: { width: 800, height: 600 } };

describe('canOpenOnMobile', () => {
	it('mobil támogatás nélküli app nem nyitható meg', () => {
		expect(canOpenOnMobile(base)).toBe(false);
		expect(canOpenOnMobile(undefined)).toBe(false);
	});

	it('bejegyzések nélküli mobil app bármikor megnyitható', () => {
		expect(canOpenOnMobile({ ...base, mobile: { entries: [] } }, { foo: 1 })).toBe(true);
	});

	it('bejegyzéses app csak létező bejegyzésre mutató paraméterrel nyitható meg', () => {
		const app: AppMetadata = {
			...base,
			mobile: { entries: [{ id: 'leave', label: 'Szabadság', component: 'MobileLeave' }] }
		};
		expect(canOpenOnMobile(app, { mobileEntry: 'leave' })).toBe(true);
		expect(canOpenOnMobile(app, { mobileEntry: 'missing' })).toBe(false);
		expect(canOpenOnMobile(app, {})).toBe(false);
	});
});
