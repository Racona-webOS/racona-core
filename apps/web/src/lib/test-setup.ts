/**
 * Vitest globális setup.
 *
 * A @testing-library/jest-dom/vitest regisztrálja a DOM matchereket
 * (toBeInTheDocument, toBeDisabled, …) és kiterjeszti a vitest Assertion
 * típusát, így a komponens tesztek típushelyesen használhatják őket.
 */

import '@testing-library/jest-dom/vitest';

/**
 * jsdom hiányzó böngésző API-k.
 *
 * A bits-ui komponensek ResizeObserver-t használnak, amit a jsdom nem
 * implementál — enélkül minden komponens teszt elszáll.
 */
if (!globalThis.ResizeObserver) {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
}

if (!globalThis.matchMedia) {
	globalThis.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})) as unknown as typeof matchMedia;
}
