/**
 * Asset Service
 *
 * Plugin asset fájlok URL generálása.
 * URL formátum: /api/plugins/{plugin_id}/assets/{assetPath}
 */

import type { AssetService as IAssetService } from '../../types/index.js';

export class AssetService implements IAssetService {
	private readonly pluginId: string;

	/** @param pluginId - Plugin egyedi azonosítója */
	constructor(pluginId: string) {
		this.pluginId = pluginId;
	}

	/**
	 * Asset URL generálása
	 *
	 * @param assetPath - Asset fájl elérési útja (relatív a plugin assets/ könyvtárához)
	 * @returns Teljes URL
	 */
	getUrl(assetPath: string): string {
		const sanitized = this.sanitizePath(assetPath);
		return `/api/plugins/${this.pluginId}/assets/${sanitized}`;
	}

	/** Path sanitizálás (path traversal védelem) */
	private sanitizePath(path: string): string {
		return path.replace(/\.\./g, '').replace(/^\/+/, '').replace(/\/+/g, '/');
	}
}
