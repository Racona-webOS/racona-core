/**
 * Context Service
 *
 * Plugin context information and window controls.
 */

import type {
	ContextService as IContextService,
	ShellMode,
	UserInfo,
	WindowControls
} from '../../types/index.js';

/** The core sets this global to the current interface before loading plugins */
const SHELL_GLOBAL = '__RACONA_SHELL__';

/** Context service — plugin identity, authenticated user, permissions, and window controls. */
export class ContextService implements IContextService {
	/** Unique plugin identifier */
	readonly pluginId: string;
	/** Authenticated user data */
	readonly user: UserInfo;
	/** Parameters passed when the app was launched */
	readonly params: Record<string, unknown>;
	/** List of permissions granted to the plugin */
	readonly permissions: string[];
	/** Window controls (close, setTitle) */
	readonly window: WindowControls;

	/** The interface the app runs in (`desktop` unless the core reports `mobile`) */
	get shell(): ShellMode {
		const value = (globalThis as Record<string, unknown>)[SHELL_GLOBAL];
		return value === 'mobile' ? 'mobile' : 'desktop';
	}

	/**
	 * @param pluginId - Unique plugin identifier
	 * @param user - Authenticated user data
	 * @param params - Parameters passed when the app was launched
	 * @param permissions - List of permissions granted to the plugin
	 * @param windowElement - Optional Window reference (for iframe-based plugins)
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
