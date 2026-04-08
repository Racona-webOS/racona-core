import type { DatabaseEmailTemplate, ITemplateCache } from '../types/email-templates';
import type { EmailTemplateType } from '../../email/types';
import { CACHE_KEYS } from './email-template-cache';

/**
 * Cache warm-up strategy configuration.
 */
export interface WarmUpConfig {
	preloadAllActive: boolean;
	preloadTypes: EmailTemplateType[];
	batchSize: number;
	maxRetries: number;
}

/**
 * Template cache manager for advanced cache operations.
 */
export class TemplateCacheManager {
	private cache: ITemplateCache;
	private warmUpConfig: WarmUpConfig;

	constructor(cache: ITemplateCache, warmUpConfig?: Partial<WarmUpConfig>) {
		this.cache = cache;
		this.warmUpConfig = {
			preloadAllActive: true,
			preloadTypes: [],
			batchSize: 10,
			maxRetries: 3,
			...warmUpConfig
		};
	}

	/**
	 * Warm up cache with frequently used templates.
	 * @param templates - Templates to preload into cache
	 */
	async warmUp(templates: DatabaseEmailTemplate[]): Promise<void> {
		console.log(`[TemplateCacheManager] Starting cache warm-up with ${templates.length} templates`);

		const batches = this.createBatches(templates, this.warmUpConfig.batchSize);
		let successCount = 0;
		let errorCount = 0;

		for (const batch of batches) {
			try {
				await this.warmUpBatch(batch);
				successCount += batch.length;
			} catch (error) {
				errorCount += batch.length;
				console.error('[TemplateCacheManager] Batch warm-up failed:', error);
			}
		}

		console.log(
			`[TemplateCacheManager] Cache warm-up completed. Success: ${successCount}, Errors: ${errorCount}`
		);
	}

	/**
	 * Warm up cache with specific template types.
	 * @param templatesByType - Map of template types to templates.
	 */
	async warmUpByTypes(
		templatesByType: Map<EmailTemplateType, DatabaseEmailTemplate>
	): Promise<void> {
		const entries = new Map<string, DatabaseEmailTemplate>();

		for (const [type, template] of templatesByType) {
			const cacheKey = CACHE_KEYS.templateByType(type);
			entries.set(cacheKey, template);
		}

		await this.cache.setMultiple(entries);
		console.log(`[TemplateCacheManager] Warmed up ${entries.size} templates by type`);
	}

	/**
	 * Invalidate cache entries matching a pattern.
	 * @param pattern - Pattern to match cache keys (supports wildcards)
	 */
	async invalidatePattern(pattern: string): Promise<number> {
		const keys = await this.cache.keys();
		const regex = this.patternToRegex(pattern);
		const matchingKeys = keys.filter((key) => regex.test(key));

		for (const key of matchingKeys) {
			await this.cache.delete(key);
		}

		console.log(
			`[TemplateCacheManager] Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`
		);
		return matchingKeys.length;
	}

	/**
	 * Refresh cache entries that are about to expire.
	 * @param thresholdSeconds - Refresh entries expiring within this threshold
	 * @param refreshCallback - Function to fetch fresh data
	 */
	async refreshExpiring(
		thresholdSeconds: number,
		refreshCallback: (key: string) => Promise<DatabaseEmailTemplate | null>
	): Promise<void> {
		const keys = await this.cache.keys();
		const refreshPromises: Promise<void>[] = [];

		for (const key of keys) {
			const ttl = await this.cache.getTtl(key);
			if (ttl > 0 && ttl <= thresholdSeconds) {
				refreshPromises.push(this.refreshKey(key, refreshCallback));
			}
		}

		await Promise.allSettled(refreshPromises);
		console.log(
			`[TemplateCacheManager] Refreshed ${refreshPromises.length} expiring cache entries`
		);
	}

	/**
	 * Get cache health metrics.
	 */
	async getHealthMetrics(): Promise<{
		stats: ReturnType<ITemplateCache['getStats']>;
		expiringSoon: number;
		memoryUsage: number;
	}> {
		const stats = this.cache.getStats();
		const keys = await this.cache.keys();

		// Count entries expiring in next 5 minutes
		let expiringSoon = 0;
		for (const key of keys) {
			const ttl = await this.cache.getTtl(key);
			if (ttl > 0 && ttl <= 300) {
				// 5 minutes
				expiringSoon++;
			}
		}

		// Estimate memory usage (rough calculation)
		const memoryUsage = this.estimateMemoryUsage(stats.size);

		return {
			stats,
			expiringSoon,
			memoryUsage
		};
	}

	/**
	 * Optimize cache by removing expired entries and defragmenting.
	 */
	async optimize(): Promise<{
		removedExpired: number;
		beforeSize: number;
		afterSize: number;
	}> {
		const beforeStats = this.cache.getStats();
		const beforeSize = beforeStats.size;

		// Force cleanup by checking all keys (this triggers cleanup of expired entries)
		await this.cache.keys();
		const afterStats = this.cache.getStats();
		const afterSize = afterStats.size;

		const removedExpired = beforeSize - afterSize;

		console.log(
			`[TemplateCacheManager] Cache optimization completed. Removed ${removedExpired} expired entries`
		);

		return {
			removedExpired,
			beforeSize,
			afterSize
		};
	}

	/**
	 * Create batches from templates array.
	 * @param items
	 * @param batchSize
	 */
	private createBatches<T>(items: T[], batchSize: number): T[][] {
		const batches: T[][] = [];
		for (let i = 0; i < items.length; i += batchSize) {
			batches.push(items.slice(i, i + batchSize));
		}
		return batches;
	}

	/**
	 * Warm up a batch of templates.
	 * @param templates
	 */
	private async warmUpBatch(templates: DatabaseEmailTemplate[]): Promise<void> {
		const entries = new Map<string, DatabaseEmailTemplate>();

		for (const template of templates) {
			// Cache by type
			const typeKey = CACHE_KEYS.templateByType(template.type as EmailTemplateType);
			entries.set(typeKey, template);

			// Cache by ID
			const idKey = CACHE_KEYS.templateById(template.id);
			entries.set(idKey, template);
		}

		await this.cache.setMultiple(entries);
	}

	/**
	 * Refresh a single cache key.
	 * @param key
	 * @param refreshCallback
	 */
	private async refreshKey(
		key: string,
		refreshCallback: (key: string) => Promise<DatabaseEmailTemplate | null>
	): Promise<void> {
		try {
			const freshData = await refreshCallback(key);
			if (freshData) {
				await this.cache.set(key, freshData);
			} else {
				await this.cache.delete(key);
			}
		} catch (error) {
			console.error(`[TemplateCacheManager] Failed to refresh key ${key}:`, error);
		}
	}

	/**
	 * Convert wildcard pattern to regex.
	 * @param pattern
	 */
	private patternToRegex(pattern: string): RegExp {
		const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regexPattern = escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
		return new RegExp(`^${regexPattern}$`);
	}

	/**
	 * Estimate memory usage of cache.
	 * @param entryCount
	 */
	private estimateMemoryUsage(entryCount: number): number {
		// Rough estimation: each entry ~2KB (template content + metadata)
		return entryCount * 2048;
	}
}
