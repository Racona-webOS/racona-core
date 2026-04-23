/**
 * Admin Config Store
 *
 * Admin-szintű külső szolgáltatások konfigurációjának kezelése (AI Assistant, TTS Provider)
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import type { AIAssistantConfig, UsageMetrics } from '@racona/database/schemas';
import {
	getAIAssistantConfig,
	updateAIAssistantConfig,
	testAIAgentConnection,
	testTTSProviderConnection,
	getUsageMetrics,
	getUsageTrends
} from '../admin-config.remote';

interface AdminConfigState {
	// AI Assistant konfiguráció
	aiAssistantConfig: AIAssistantConfig | null;

	// Usage metrikák
	usageMetrics: UsageMetrics[];
	usageTrends: Array<{
		period: string;
		serviceType: string;
		providerName: string;
		totalRequests: number;
		totalTokens: number | null;
		totalCharacters: number | null;
		totalCost: number;
	}>;

	// Loading states
	loading: boolean;
	loadingConfig: boolean;
	loadingMetrics: boolean;
	loadingTest: boolean;

	// Error states
	error: string | null;
	testError: string | null;

	// Success states
	testSuccess: string | null;
	saveSuccess: boolean;
}

const initialState: AdminConfigState = {
	aiAssistantConfig: null,
	usageMetrics: [],
	usageTrends: [],
	loading: false,
	loadingConfig: false,
	loadingMetrics: false,
	loadingTest: false,
	error: null,
	testError: null,
	testSuccess: null,
	saveSuccess: false
};

export class AdminConfigStore {
	state = $state<AdminConfigState>({ ...initialState });

	/**
	 * Admin konfigurációk betöltése
	 * Requirements: 6.1, 6.2
	 */
	async loadConfigs(): Promise<void> {
		this.state.loadingConfig = true;
		this.state.error = null;

		try {
			const result = await getAIAssistantConfig();

			if (result.success && result.config) {
				this.state.aiAssistantConfig = result.config;
			} else {
				this.state.error = result.error || 'Failed to load AI Assistant configuration';
			}
		} catch (error) {
			console.error('Error loading admin configs:', error);
			this.state.error = 'Failed to load configurations';
		} finally {
			this.state.loadingConfig = false;
		}
	}

	/**
	 * AI Assistant konfiguráció frissítése
	 * Requirements: 6.3, 6.4, 6.5
	 */
	async updateAIAssistantConfig(config: {
		aiAgent: {
			provider: string;
			apiKey: string;
			model: string;
			baseUrl?: string;
			advancedParams: {
				maxTokens: number;
				temperature: number;
				topP?: number;
			};
		};
		ttsProvider: {
			provider: string;
			apiKey?: string;
			voiceId?: string;
			language?: string;
		};
	}): Promise<boolean> {
		this.state.loading = true;
		this.state.error = null;
		this.state.saveSuccess = false;

		try {
			const result = await updateAIAssistantConfig(config);

			if (result.success) {
				this.state.saveSuccess = true;
				// Invalidate cache és újratöltés
				await this.loadConfigs();
				return true;
			} else {
				this.state.error = result.error || 'Failed to update AI Assistant configuration';
				return false;
			}
		} catch (error) {
			console.error('Error updating AI Assistant config:', error);
			this.state.error = 'Failed to update configuration';
			return false;
		} finally {
			this.state.loading = false;
		}
	}

	/**
	 * AI Agent kapcsolat tesztelése
	 * Requirements: 2.7, 2.8
	 */
	async testAIAgentConnection(config: {
		provider: string;
		apiKey: string;
		model: string;
		baseUrl?: string;
	}): Promise<boolean> {
		this.state.loadingTest = true;
		this.state.testError = null;
		this.state.testSuccess = null;

		try {
			const result = await testAIAgentConnection(config);

			if (result.success) {
				this.state.testSuccess = result.message || 'Connection successful';
				return true;
			} else {
				this.state.testError = result.error || 'Connection test failed';
				return false;
			}
		} catch (error) {
			console.error('Error testing AI Agent connection:', error);
			this.state.testError = 'Connection test failed';
			return false;
		} finally {
			this.state.loadingTest = false;
		}
	}

	/**
	 * TTS Provider kapcsolat tesztelése
	 * Requirements: 3.6, 3.7, 3.8, 3.9
	 */
	async testTTSProviderConnection(config: {
		provider: string;
		apiKey?: string;
		voiceId?: string;
	}): Promise<boolean> {
		this.state.loadingTest = true;
		this.state.testError = null;
		this.state.testSuccess = null;

		try {
			const result = await testTTSProviderConnection(config);

			if (result.success) {
				this.state.testSuccess = result.message || 'Connection successful';
				return true;
			} else {
				this.state.testError = result.error || 'Connection test failed';
				return false;
			}
		} catch (error) {
			console.error('Error testing TTS Provider connection:', error);
			this.state.testError = 'Connection test failed';
			return false;
		} finally {
			this.state.loadingTest = false;
		}
	}

	/**
	 * Általános kapcsolat tesztelése (AI Agent vagy TTS Provider)
	 * Requirements: 2.7, 2.8, 3.6, 3.7, 3.8, 3.9
	 */
	async testConnection(
		type: 'ai-agent' | 'tts',
		config: {
			provider: string;
			apiKey?: string;
			model?: string;
			baseUrl?: string;
			voiceId?: string;
		}
	): Promise<boolean> {
		if (type === 'ai-agent') {
			if (!config.apiKey || !config.model) {
				this.state.testError = 'API key and model are required for AI Agent testing';
				return false;
			}
			return await this.testAIAgentConnection({
				provider: config.provider,
				apiKey: config.apiKey,
				model: config.model,
				baseUrl: config.baseUrl
			});
		} else {
			return await this.testTTSProviderConnection({
				provider: config.provider,
				apiKey: config.apiKey,
				voiceId: config.voiceId
			});
		}
	}

	/**
	 * Usage metrikák betöltése
	 * Requirements: 8.1, 8.2
	 */
	async loadUsageMetrics(
		configKey: string = 'ai_assistant',
		startDate?: string,
		endDate?: string
	): Promise<void> {
		this.state.loadingMetrics = true;
		this.state.error = null;

		try {
			const result = await getUsageMetrics({
				configKey,
				startDate,
				endDate
			});

			if (result.success && result.metrics) {
				this.state.usageMetrics = result.metrics;
			} else {
				this.state.error = result.error || 'Failed to load usage metrics';
			}
		} catch (error) {
			console.error('Error loading usage metrics:', error);
			this.state.error = 'Failed to load usage metrics';
		} finally {
			this.state.loadingMetrics = false;
		}
	}

	/**
	 * Usage trendek betöltése
	 * Requirements: 8.3
	 */
	async loadUsageTrends(
		configKey: string = 'ai_assistant',
		period: 'daily' | 'weekly' | 'monthly' = 'daily',
		startDate?: string,
		endDate?: string
	): Promise<void> {
		this.state.loadingMetrics = true;
		this.state.error = null;

		try {
			const result = await getUsageTrends({
				configKey,
				period,
				startDate,
				endDate
			});

			if (result.success && result.trends) {
				this.state.usageTrends = result.trends;
			} else {
				this.state.error = result.error || 'Failed to load usage trends';
			}
		} catch (error) {
			console.error('Error loading usage trends:', error);
			this.state.error = 'Failed to load usage trends';
		} finally {
			this.state.loadingMetrics = false;
		}
	}

	/**
	 * Cache invalidálás és újratöltés
	 * Requirements: 6.7
	 */
	async invalidateCache(): Promise<void> {
		// Cache invalidálás konfiguráció frissítéskor
		await this.loadConfigs();
	}

	/**
	 * Error állapot törlése
	 */
	clearError(): void {
		this.state.error = null;
		this.state.testError = null;
	}

	/**
	 * Success állapot törlése
	 */
	clearSuccess(): void {
		this.state.testSuccess = null;
		this.state.saveSuccess = false;
	}

	/**
	 * Teljes állapot visszaállítása
	 */
	reset(): void {
		this.state = { ...initialState };
	}

	// Computed properties (getters)

	/**
	 * Van-e betöltött AI Assistant konfiguráció
	 */
	get hasAIAssistantConfig(): boolean {
		return this.state.aiAssistantConfig !== null;
	}

	/**
	 * AI Agent provider neve
	 */
	get aiAgentProvider(): string | null {
		return this.state.aiAssistantConfig?.aiAgent?.provider || null;
	}

	/**
	 * TTS Provider neve
	 */
	get ttsProvider(): string | null {
		return this.state.aiAssistantConfig?.ttsProvider?.provider || null;
	}

	/**
	 * Van-e aktív loading állapot
	 */
	get isLoading(): boolean {
		return (
			this.state.loading ||
			this.state.loadingConfig ||
			this.state.loadingMetrics ||
			this.state.loadingTest
		);
	}

	/**
	 * Van-e hiba
	 */
	get hasError(): boolean {
		return this.state.error !== null || this.state.testError !== null;
	}

	/**
	 * Van-e success üzenet
	 */
	get hasSuccess(): boolean {
		return this.state.testSuccess !== null || this.state.saveSuccess;
	}
}

/**
 * Admin Config Store példány létrehozása
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export function createAdminConfigStore(): AdminConfigStore {
	return new AdminConfigStore();
}

// Global singleton instance (opcionális, ha globális hozzáférés szükséges)
let globalAdminConfigStore: AdminConfigStore | null = null;

/**
 * Globális Admin Config Store példány lekérése
 */
export function getAdminConfigStore(): AdminConfigStore {
	if (!globalAdminConfigStore) {
		globalAdminConfigStore = new AdminConfigStore();
	}
	return globalAdminConfigStore;
}

/**
 * Globális Admin Config Store példány beállítása
 */
export function setAdminConfigStore(store: AdminConfigStore): void {
	globalAdminConfigStore = store;
}
