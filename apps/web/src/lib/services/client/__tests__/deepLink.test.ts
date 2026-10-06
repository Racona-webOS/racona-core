import { describe, it, expect, vi } from 'vitest';
import { parseDeepLink, stripDeepLink, openDeepLink } from '../deepLink';
import type { WindowManager } from '$lib/stores';
import type { AppMetadata } from '$lib/types/window';

const url = (query: string) => new URL(`http://localhost:3000/admin${query}`);

describe('parseDeepLink', () => {
	it('reads app, entry and section', () => {
		expect(parseDeepLink(url('?app=racona-work&entry=worklog'))).toEqual({
			app: 'racona-work',
			entry: 'worklog',
			section: undefined
		});
		expect(parseDeepLink(url('?app=settings&section=settings/work-log'))).toMatchObject({
			app: 'settings',
			section: 'settings/work-log'
		});
	});

	it('returns null without a valid app name', () => {
		expect(parseDeepLink(url(''))).toBeNull();
		expect(parseDeepLink(url('?app=../etc'))).toBeNull();
		expect(parseDeepLink(url('?app=Racona Work'))).toBeNull();
	});

	it('drops invalid entry and section values', () => {
		expect(parseDeepLink(url('?app=x&entry=<script>&section=a//b'))).toEqual({
			app: 'x',
			entry: undefined,
			section: undefined
		});
	});
});

describe('stripDeepLink', () => {
	it('removes only the deep link parameters', () => {
		expect(stripDeepLink(url('?app=x&entry=y&section=z&keep=1')).search).toBe('?keep=1');
	});
});

describe('openDeepLink', () => {
	const app: AppMetadata = {
		appName: 'racona-work',
		title: 'Racona Work',
		defaultSize: { width: 800, height: 600 },
		mobile: { entries: [{ id: 'worklog', label: 'Munka rögzítése', component: 'MobileWorkLog' }] }
	};

	function manager() {
		return {
			openWindow: vi.fn(() => 'window-1'),
			updateWindowTitle: vi.fn()
		} as unknown as WindowManager & { openWindow: ReturnType<typeof vi.fn> };
	}

	it('opens the entry component on mobile', () => {
		const wm = manager();
		expect(openDeepLink(wm, app, { app: 'racona-work', entry: 'worklog' }, 'mobile')).toBe(true);
		expect(wm.openWindow).toHaveBeenCalledWith('racona-work', 'Munka rögzítése', app, {
			section: undefined,
			mobileEntry: 'worklog',
			mobileComponent: 'MobileWorkLog'
		});
	});

	it('does not open the full desktop app on mobile', () => {
		const wm = manager();
		expect(openDeepLink(wm, app, { app: 'racona-work' }, 'mobile')).toBe(false);
		expect(wm.openWindow).not.toHaveBeenCalled();
	});

	it('opens the app with the section on desktop', () => {
		const wm = manager();
		openDeepLink(wm, app, { app: 'racona-work', section: 'leave-requests' }, 'desktop');
		expect(wm.openWindow).toHaveBeenCalledWith('racona-work', 'Racona Work', app, {
			section: 'leave-requests'
		});
	});
});
