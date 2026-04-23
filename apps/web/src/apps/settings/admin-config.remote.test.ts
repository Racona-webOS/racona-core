/**
 * Admin Config Remote Actions Tests
 *
 * Unit tests for admin-config.remote.ts
 * Requirements: 3.4 - Server-side API routes tesztelése
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock dependencies BEFORE importing the module
vi.mock('$lib/server/database/repositories', () => ({
	adminConfigRepository: {
		getByConfigKey: vi.fn(),
		upsert: vi.fn(),
		delete: vi.fn()
	}
}));

vi.mock('$lib/server/utils/encryption', () => ({
	encrypt: vi.fn(),
	decrypt: vi.fn(),
	maskApiKey: vi.fn()
}));

vi.mock('$app/server', () => ({
	command: (schema: any, handler: any) => handler,
	query: (handler: any) => handler,
	getRequestEvent: vi.fn()
}));

// Import after mocks are set up
const adminConfigRemote = await import('./admin-config.remote');
const { adminConfigRepository } = await import('$lib/server/database/repositories');
const { encrypt, decrypt, maskApiKey } = await import('$lib/server/utils/encryption');
const { getRequestEvent } = await import('$app/server');

describe('Admin Config Remote Actions', () => {
	const mockAdminUser = {
		id: '1',
		role: ['admin']
	};

	const mockNonAdminUser = {
		id: '2',
		role: ['user']
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ============================================================================
	// 3.1 Admin Config CRUD Tests
	// ============================================================================

	describe('getAdminConfig', () => {
		it('should return config for admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const mockConfig = {
				id: 1,
				configKey: 'ai_assistant',
				configData: { test: 'data' },
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1
			};

			(adminConfigRepository.getByConfigKey as Mock).mockResolvedValue(mockConfig);

			const result = await adminConfigRemote.getAdminConfig({ configKey: 'ai_assistant' });

			expect(result.success).toBe(true);
			expect(result.config).toEqual(mockConfig);
			expect(adminConfigRepository.getByConfigKey).toHaveBeenCalledWith('ai_assistant');
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.getAdminConfig({ configKey: 'ai_assistant' });

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
			expect(adminConfigRepository.getByConfigKey).not.toHaveBeenCalled();
		});

		it('should return error when config not found', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			(adminConfigRepository.getByConfigKey as Mock).mockResolvedValue(null);

			const result = await adminConfigRemote.getAdminConfig({ configKey: 'nonexistent' });

			expect(result.success).toBe(false);
			expect(result.error).toBe('Configuration not found');
		});
	});

	describe('getAIAssistantConfig', () => {
		it('should return masked config for admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const mockConfig = {
				id: 1,
				configKey: 'ai_assistant',
				configData: {
					aiAgent: {
						provider: 'openai',
						apiKeyEncrypted: 'encrypted_key',
						model: 'gpt-4',
						advancedParams: {
							maxTokens: 2000,
							temperature: 0.7
						}
					},
					ttsProvider: {
						provider: 'elevenlabs',
						apiKeyEncrypted: 'encrypted_tts_key'
					}
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1
			};

			(adminConfigRepository.getByConfigKey as Mock).mockResolvedValue(mockConfig);
			(decrypt as Mock).mockResolvedValue('decrypted_key');
			(maskApiKey as Mock).mockReturnValue('sk-****1234');

			const result = await adminConfigRemote.getAIAssistantConfig();

			expect(result.success).toBe(true);
			expect(result.config?.aiAgent.apiKeyEncrypted).toBe('sk-****1234');
			expect(decrypt).toHaveBeenCalledTimes(2);
			expect(maskApiKey).toHaveBeenCalledTimes(2);
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.getAIAssistantConfig();

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
		});
	});

	describe('updateAIAssistantConfig', () => {
		const validConfig = {
			aiAgent: {
				provider: 'openai',
				apiKey: 'sk-test1234567890',
				model: 'gpt-4',
				advancedParams: {
					maxTokens: 2000,
					temperature: 0.7,
					topP: 0.9
				}
			},
			ttsProvider: {
				provider: 'elevenlabs',
				apiKey: 'test_tts_key',
				voiceId: 'voice123',
				language: 'en'
			}
		};

		it('should update config for admin user with valid data', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			(encrypt as Mock).mockResolvedValue('encrypted_value');
			(adminConfigRepository.upsert as Mock).mockResolvedValue({});

			const result = await adminConfigRemote.updateAIAssistantConfig(validConfig);

			expect(result.success).toBe(true);
			expect(encrypt).toHaveBeenCalledTimes(2);
			expect(adminConfigRepository.upsert).toHaveBeenCalledWith(
				'ai_assistant',
				expect.objectContaining({
					aiAgent: expect.objectContaining({
						provider: 'openai',
						apiKeyEncrypted: 'encrypted_value'
					})
				}),
				1
			);
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.updateAIAssistantConfig(validConfig);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
			expect(adminConfigRepository.upsert).not.toHaveBeenCalled();
		});

		it('should validate OpenAI API key format', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const invalidConfig = {
				...validConfig,
				aiAgent: {
					...validConfig.aiAgent,
					apiKey: 'invalid_key'
				}
			};

			const result = await adminConfigRemote.updateAIAssistantConfig(invalidConfig);

			expect(result.success).toBe(false);
			expect(result.error).toContain('OpenAI API key must start with "sk-"');
			expect(adminConfigRepository.upsert).not.toHaveBeenCalled();
		});

		it('should validate Anthropic API key format', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const anthropicConfig = {
				...validConfig,
				aiAgent: {
					...validConfig.aiAgent,
					provider: 'anthropic',
					apiKey: 'invalid_key'
				}
			};

			const result = await adminConfigRemote.updateAIAssistantConfig(anthropicConfig);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Anthropic API key must start with "sk-ant-"');
		});
	});

	describe('deleteAIAssistantConfig', () => {
		it('should delete config for admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			(adminConfigRepository.delete as Mock).mockResolvedValue(true);

			const result = await adminConfigRemote.deleteAIAssistantConfig({
				configKey: 'ai_assistant'
			});

			expect(result.success).toBe(true);
			expect(adminConfigRepository.delete).toHaveBeenCalledWith('ai_assistant');
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.deleteAIAssistantConfig({
				configKey: 'ai_assistant'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
		});

		it('should return error when config not found', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			(adminConfigRepository.delete as Mock).mockResolvedValue(false);

			const result = await adminConfigRemote.deleteAIAssistantConfig({
				configKey: 'nonexistent'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Configuration not found');
		});
	});

	// ============================================================================
	// 3.2 Connection Testing Tests
	// ============================================================================

	describe('testAIAgentConnection', () => {
		it('should test OpenAI connection successfully', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: 'gpt-4' })
			});

			const result = await adminConfigRemote.testAIAgentConnection({
				provider: 'openai',
				apiKey: 'sk-test1234567890',
				model: 'gpt-4'
			});

			expect(result.success).toBe(true);
			expect(result.message).toBe('Connection successful');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.openai.com/v1/models/gpt-4',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer sk-test1234567890'
					})
				})
			);
		});

		it('should handle OpenAI connection error', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Unauthorized',
				json: async () => ({ error: { message: 'Invalid API key' } })
			});

			const result = await adminConfigRemote.testAIAgentConnection({
				provider: 'openai',
				apiKey: 'sk-invalid',
				model: 'gpt-4'
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Invalid API key');
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.testAIAgentConnection({
				provider: 'openai',
				apiKey: 'sk-test',
				model: 'gpt-4'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
		});

		it('should validate API key format before testing', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const result = await adminConfigRemote.testAIAgentConnection({
				provider: 'openai',
				apiKey: 'invalid_key',
				model: 'gpt-4'
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('OpenAI API key must start with "sk-"');
		});
	});

	describe('testTTSProviderConnection', () => {
		it('should test browser provider successfully', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const result = await adminConfigRemote.testTTSProviderConnection({
				provider: 'browser'
			});

			expect(result.success).toBe(true);
			expect(result.message).toBe('Browser Web Speech API is available');
		});

		it('should test ElevenLabs connection successfully', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ voices: [{ voice_id: '1' }, { voice_id: '2' }] })
			});

			const result = await adminConfigRemote.testTTSProviderConnection({
				provider: 'elevenlabs',
				apiKey: 'test_key'
			});

			expect(result.success).toBe(true);
			expect(result.message).toContain('Found 2 voices');
		});

		it('should require API key for ElevenLabs', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const result = await adminConfigRemote.testTTSProviderConnection({
				provider: 'elevenlabs'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('API key is required for ElevenLabs');
		});

		it('should deny access for non-admin user', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockNonAdminUser }
			});

			const result = await adminConfigRemote.testTTSProviderConnection({
				provider: 'browser'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unauthorized: Admin role required');
		});
	});

	// ============================================================================
	// 3.3 Usage Metrics Tests
	// ============================================================================
	// Encryption/Decryption Flow Tests
	// ============================================================================

	describe('Encryption/Decryption Flow', () => {
		it('should encrypt API keys when updating config', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			(encrypt as Mock).mockResolvedValue('encrypted_value');
			(adminConfigRepository.upsert as Mock).mockResolvedValue({});

			await adminConfigRemote.updateAIAssistantConfig({
				aiAgent: {
					provider: 'openai',
					apiKey: 'sk-plaintext',
					model: 'gpt-4',
					advancedParams: {
						maxTokens: 2000,
						temperature: 0.7
					}
				},
				ttsProvider: {
					provider: 'browser'
				}
			});

			expect(encrypt).toHaveBeenCalledWith('sk-plaintext');
		});

		it('should decrypt and mask API keys when retrieving config', async () => {
			(getRequestEvent as Mock).mockReturnValue({
				locals: { user: mockAdminUser }
			});

			const mockConfig = {
				id: 1,
				configKey: 'ai_assistant',
				configData: {
					aiAgent: {
						provider: 'openai',
						apiKeyEncrypted: 'encrypted_key',
						model: 'gpt-4',
						advancedParams: {
							maxTokens: 2000,
							temperature: 0.7
						}
					},
					ttsProvider: {
						provider: 'browser'
					}
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1
			};

			(adminConfigRepository.getByConfigKey as Mock).mockResolvedValue(mockConfig);
			(decrypt as Mock).mockResolvedValue('sk-plaintext1234567890');
			(maskApiKey as Mock).mockReturnValue('sk-****7890');

			const result = await adminConfigRemote.getAIAssistantConfig();

			expect(decrypt).toHaveBeenCalledWith('encrypted_key');
			expect(maskApiKey).toHaveBeenCalledWith('sk-plaintext1234567890');
			expect(result.config?.aiAgent.apiKeyEncrypted).toBe('sk-****7890');
		});
	});
});
