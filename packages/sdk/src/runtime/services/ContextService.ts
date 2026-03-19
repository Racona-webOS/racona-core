/**
 * Context Service
 *
 * Plugin kontextus információk és ablak vezérlők.
 */

import type {
	ContextService as IContextService,
	UserInfo,
	WindowControls
} from '../../types/index.js';

export class ContextService implements IContextService {
	/** Plugin egyedi azonosítója */
	readonly pluginId: string;
	/** Bejelentkezett felhasználó adatai */
	readonly user: UserInfo;
	/** Plugin indításkor átadott paraméterek */
	readonly params: Record<string, unknown>;
	/** Plugin jogosultságok listája */
	readonly permissions: string[];
	/** Ablak vezérlők (close, setTitle) */
	readonly window: WindowControls;

	/**
	 * @param pluginId - Plugin egyedi azonosítója
	 * @param user - Bejelentkezett felhasználó adatai
	 * @param params - Plugin indításkor átadott paraméterek
	 * @param permissions - Plugin jogosultságok listája
	 * @param windowElement - Opcionális Window referencia (iframe-hez)
	 */
	constructor(
		pluginId: string,
		user: UserInfo,
		params: Record<string, unknown>,
		permissions: string[],
		windowElement?: Window
	) {
		this.pluginId = pluginId;
		this.user = user;
		this.params = params;
		this.permissions = permissions;

		this.window = {
			close: () => {
				if (windowElement) {
					windowElement.close();
				} else if (typeof globalThis.window !== 'undefined') {
					globalThis.window.dispatchEvent(
						new CustomEvent('plugin:close', { detail: { pluginId } })
					);
				}
			},
			setTitle: (title: string) => {
				if (windowElement) {
					windowElement.document.title = title;
				} else if (typeof globalThis.window !== 'undefined') {
					globalThis.window.dispatchEvent(
						new CustomEvent('plugin:setTitle', { detail: { pluginId, title } })
					);
				}
			}
		};
	}
}
