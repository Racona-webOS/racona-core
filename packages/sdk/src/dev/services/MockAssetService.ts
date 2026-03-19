/**
 * Mock Asset Service
 *
 * Mock asset URL generálás.
 */

import type { AssetService } from '../../types/index.js';

export interface MockAssetConfig {
	baseUrl?: string;
}

export class MockAssetService implements AssetService {
	private readonly baseUrl: string;

	/** @param config - Opcionális base URL konfiguráció (alapértelmezett: `/assets`) */
	constructor(config?: MockAssetConfig) {
		this.baseUrl = config?.baseUrl ?? '/assets';
	}

	/**
	 * Mock asset URL generálása a konfigurált base URL alapján.
	 * @param assetPath - Asset fájl elérési útja (relatív)
	 * @returns Teljes URL
	 */
	getUrl(assetPath: string): string {
		const sanitized = assetPath.replace(/\.\./g, '').replace(/^\/+/, '');
		return `${this.baseUrl}/${sanitized}`;
	}
}
