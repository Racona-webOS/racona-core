/**
 * @module
 * Mock SDK for standalone ElyOS app development.
 *
 * Use this module during local development when a running ElyOS instance is not available.
 * All services are simulated locally — toasts log to the console, data is stored in localStorage.
 *
 * @example
 * ```ts
 * import { MockWebOSSDK } from '@elyos-dev/sdk/dev';
 *
 * if (!window.webOS) {
 *   MockWebOSSDK.initialize({
 *     context: {
 *       pluginId: 'my-app',
 *       user: { id: '1', name: 'Dev User', email: 'dev@example.com', roles: ['admin'], groups: [] }
 *     }
 *   });
 * }
 * ```
 */

export { MockWebOSSDK } from './MockWebOSSDK.js';
export { MockUIService } from './services/MockUIService.js';
export { MockRemoteService } from './services/MockRemoteService.js';
export { MockDataService } from './services/MockDataService.js';
export { MockI18nService } from './services/MockI18nService.js';
export { MockNotificationService } from './services/MockNotificationService.js';
export { MockContextService } from './services/MockContextService.js';
export { MockAssetService } from './services/MockAssetService.js';

export type { MockRemoteConfig } from './services/MockRemoteService.js';
export type { MockDataConfig } from './services/MockDataService.js';
export type { MockContextConfig } from './services/MockContextService.js';
export type { MockI18nConfig } from './services/MockI18nService.js';
export type { MockAssetConfig } from './services/MockAssetService.js';
