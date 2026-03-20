/**
 * Mock Context Service
 *
 * Mock plugin context and window controls for dev mode.
 */

import type { ContextService, UserInfo, WindowControls } from '../../types/index.js';

/**
 * Configuration for the mock context service.
 *
 * Allows you to customize the mock plugin context, including plugin ID, user info,
 * launch parameters, and permissions for standalone development.
 *
 * @example
 * ```ts
 * const config: MockContextConfig = {
 *   pluginId: 'my-app',
 *   user: { name: 'Test User', email: 'test@example.com' },
 *   permissions: ['database', 'notifications']
 * };
 * ```
 */
export interface MockContextConfig {
	/**
	 * Plugin ID to use in mock context.
	 * @default `"dev-plugin"`
	 */
	pluginId?: string;
	/**
	 * Partial user info to override mock defaults.
	 * Merged with the default mock user data.
	 */
	user?: Partial<UserInfo>;
	/**
	 * Parameters passed to the app on launch.
	 * Accessible via `context.params`.
	 */
	params?: Record<string, unknown>;
	/**
	 * Permissions granted to the app.
	 * @default `["database", "notifications", "remote_functions"]`
	 */
	permissions?: string[];
}

/** Mock Context service — simulates plugin context and window controls for standalone development. */
export class MockContextService implements ContextService {
	/** Unique plugin identifier */
	readonly pluginId: string;
	/** Mock authenticated user data */
	readonly user: UserInfo;
	/** Parameters passed when the app was launched */
	readonly params: Record<string, unknown>;
	/** List of permissions granted to the plugin */
	readonly permissions: string[];
	/** Window controls — log to the console */
	readonly window: WindowControls;

	/** @param config - Optional mock context configuration */
	constructor(config?: MockContextConfig) {
		this.pluginId = config?.pluginId ?? 'dev-plugin';
		this.user = {
			id: 'mock-user-1',
			name: 'Dev User',
			email: 'dev@example.com',
			roles: ['admin'],
			groups: [],
			...config?.user
		};
		this.params = config?.params ?? {};
		this.permissions = config?.permissions ?? ['database', 'notifications', 'remote_functions'];
		this.window = {
			close: () => console.log('[Mock Window] close()'),
			setTitle: (title: string) => {
				console.log(`[Mock Window] setTitle("${title}")`);
				if (typeof document !== 'undefined') {
					document.title = title;
				}
			}
		};
	}
}
