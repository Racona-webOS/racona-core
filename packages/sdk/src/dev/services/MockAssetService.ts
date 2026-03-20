/**
 * Mock Asset Service
 *
 * Mock asset URL generation for dev mode.
 */

import type { AssetService } from '../../types/index.js';

/**
 * Configuration for the mock asset service.
 *
 * Allows you to customize the base URL used for generating asset URLs
 * during standalone development.
 *
 * @example
 * ```ts
 * const config: MockAssetConfig = {
 *   baseUrl: 'https://cdn.example.com/assets'
 * };
 * ```
 */
export interface MockAssetConfig {
	/**
	 * Base URL prepended to all asset paths.
	 * @default `"/assets"`
	 */
	baseUrl?: string;
}

/** Mock Asset service — generates asset URLs using a configurable base URL for standalone development. */
export class MockAssetService implements AssetService {
	private readonly baseUrl: string;

	/** @param config - Optional base URL configuration (default: `/assets`) */
	constructor(config?: MockAssetConfig) {
		this.baseUrl = config?.baseUrl ?? '/assets';
	}

	/**
	 * Generate a mock asset URL using the configured base URL.
	 * @param assetPath - Relative asset file path
	 * @returns Full URL
	 */
	getUrl(assetPath: string): string {
		const sanitized = assetPath.replace(/\.\./g, '').replace(/^\/+/, '');
		return `${this.baseUrl}/${sanitized}`;
	}
}
