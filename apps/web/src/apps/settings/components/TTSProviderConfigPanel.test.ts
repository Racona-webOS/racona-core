/**
 * TTSProviderConfigPanel Component Tests
 *
 * Tests for the TTS Provider configuration panel component.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { toast } from 'svelte-sonner';
import TTSProviderConfigPanel from './TTSProviderConfigPanel.svelte';

// Mock dependencies
vi.mock('svelte-sonner', () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
		info: vi.fn()
	}
}));

vi.mock('$lib/i18n/hooks', () => ({
	useI18n: () => ({
		t: (key: string, params?: any) => (params ? `${key}:${JSON.stringify(params)}` : key)
	})
}));

// Mock remote functions
const mockGetAIAssistantConfig = vi.fn();
const mockUpdateAIAssistantConfig = vi.fn();
const mockTestTTSProviderConnection = vi.fn();

vi.mock('../admin-config.remote', () => ({
	getAIAssistantConfig: mockGetAIAssistantConfig,
	updateAIAssistantConfig: mockUpdateAIAssistantConfig,
	testTTSProviderConnection: mockTestTTSProviderConnection
}));

// Mock fetch for ElevenLabs API
global.fetch = vi.fn();

describe('TTSProviderConfigPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock responses
		mockGetAIAssistantConfig.mockResolvedValue({
			success: false,
			error: 'Configuration not found'
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render component with default state', async () => {
		render(TTSProviderConfigPanel);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.ttsProvider.title')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.ttsProvider.description')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.ttsProvider.inactive')).toBeInTheDocument();
		});
	});

	it('should load existing configuration on mount', async () => {
		const mockConfig = {
			success: true,
			config: {
				aiAgent: {
					provider: 'openai',
					apiKeyEncrypted: 'sk-***1234',
					model: 'gpt-4'
				},
				ttsProvider: {
					provider: 'elevenlabs',
					apiKeyEncrypted: 'sk-***5678',
					voiceId: 'voice123',
					language: 'en'
				}
			}
		};

		mockGetAIAssistantConfig.mockResolvedValue(mockConfig);

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.ttsProvider.active')).toBeInTheDocument();
		});

		expect(mockGetAIAssistantConfig).toHaveBeenCalledOnce();
	});

	it('should handle provider selection', async () => {
		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		const providerSelect = screen.getByLabelText(
			'settings.admin.ttsProvider.provider'
		) as HTMLSelectElement;

		await fireEvent.change(providerSelect, { target: { value: 'elevenlabs' } });

		expect(providerSelect.value).toBe('elevenlabs');
	});

	it('should show API key field only for ElevenLabs provider', async () => {
		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		// Initially browser provider - no API key field
		expect(screen.queryByLabelText('settings.admin.ttsProvider.apiKey')).not.toBeInTheDocument();

		// Switch to ElevenLabs
		const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
		await fireEvent.change(providerSelect, { target: { value: 'elevenlabs' } });

		await waitFor(() => {
			expect(screen.getByLabelText('settings.admin.ttsProvider.apiKey')).toBeInTheDocument();
		});
	});

	it('should load ElevenLabs voices when API key is provided', async () => {
		const mockVoicesResponse = {
			voices: [
				{ voice_id: 'voice1', name: 'Voice 1', category: 'premade' },
				{ voice_id: 'voice2', name: 'Voice 2', category: 'cloned' }
			]
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockVoicesResponse)
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		// Switch to ElevenLabs
		const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
		await fireEvent.change(providerSelect, { target: { value: 'elevenlabs' } });

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.ttsProvider.apiKey');
			expect(apiKeyInput).toBeInTheDocument();
		});

		// Enter API key
		const apiKeyInput = screen.getByLabelText('settings.admin.ttsProvider.apiKey');
		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });

		// Click load voices button
		const loadVoicesButton = screen.getByText('settings.admin.ttsProvider.loadVoices');
		await fireEvent.click(loadVoicesButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith('https://api.elevenlabs.io/v1/voices', {
				method: 'GET',
				headers: {
					'xi-api-key': 'sk-test123'
				}
			});
		});

		expect(toast.success).toHaveBeenCalledWith(
			'settings.admin.ttsProvider.voicesLoaded:{"count":2}'
		);
	});

	it('should handle ElevenLabs voices loading error', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 401
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		// Switch to ElevenLabs and enter API key
		const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
		await fireEvent.change(providerSelect, { target: { value: 'elevenlabs' } });

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.ttsProvider.apiKey');
			expect(apiKeyInput).toBeInTheDocument();
		});

		const apiKeyInput = screen.getByLabelText('settings.admin.ttsProvider.apiKey');
		await fireEvent.input(apiKeyInput, { target: { value: 'sk-invalid' } });

		const loadVoicesButton = screen.getByText('settings.admin.ttsProvider.loadVoices');
		await fireEvent.click(loadVoicesButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('settings.admin.ttsProvider.voicesLoadFailed');
		});
	});

	it('should test browser TTS provider', async () => {
		mockTestTTSProviderConnection.mockResolvedValue({
			success: true,
			message: 'Browser Web Speech API is available'
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
			expect(testButton).toBeInTheDocument();
		});

		const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
		await fireEvent.click(testButton);

		await waitFor(() => {
			expect(mockTestTTSProviderConnection).toHaveBeenCalledWith({
				provider: 'browser',
				apiKey: undefined,
				voiceId: undefined
			});
		});

		expect(toast.success).toHaveBeenCalledWith('Browser Web Speech API is available');
	});

	it('should validate ElevenLabs requirements before testing', async () => {
		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		// Switch to ElevenLabs without API key
		const providerSelect = screen.getByLabelText('settings.admin.ttsProvider.provider');
		await fireEvent.change(providerSelect, { target: { value: 'elevenlabs' } });

		await waitFor(() => {
			const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
			expect(testButton).toBeInTheDocument();
		});

		const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
		await fireEvent.click(testButton);

		expect(toast.error).toHaveBeenCalledWith('settings.admin.ttsProvider.validation.required');
		expect(mockTestTTSProviderConnection).not.toHaveBeenCalled();
	});

	it('should save configuration successfully', async () => {
		const mockAIConfig = {
			provider: 'openai',
			apiKeyEncrypted: 'sk-***1234',
			model: 'gpt-4'
		};

		mockGetAIAssistantConfig.mockResolvedValue({
			success: true,
			config: {
				aiAgent: mockAIConfig,
				ttsProvider: {
					provider: 'browser'
				}
			}
		});

		mockUpdateAIAssistantConfig.mockResolvedValue({
			success: true
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const saveButton = screen.getByText('common.buttons.save');
			expect(saveButton).toBeInTheDocument();
		});

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockUpdateAIAssistantConfig).toHaveBeenCalledWith({
				aiAgent: mockAIConfig,
				ttsProvider: {
					provider: 'browser',
					apiKey: undefined,
					voiceId: undefined,
					language: 'en'
				}
			});
		});

		expect(toast.success).toHaveBeenCalledWith('settings.admin.ttsProvider.saveSuccess');
	});

	it('should handle missing AI Agent config error', async () => {
		mockGetAIAssistantConfig.mockResolvedValue({
			success: false,
			error: 'Configuration not found'
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const saveButton = screen.getByText('common.buttons.save');
			expect(saveButton).toBeInTheDocument();
		});

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		expect(toast.error).toHaveBeenCalledWith('settings.admin.ttsProvider.aiAgentConfigMissing');
		expect(mockUpdateAIAssistantConfig).not.toHaveBeenCalled();
	});

	it('should handle save errors', async () => {
		const mockAIConfig = {
			provider: 'openai',
			apiKeyEncrypted: 'sk-***1234',
			model: 'gpt-4'
		};

		mockGetAIAssistantConfig.mockResolvedValue({
			success: true,
			config: {
				aiAgent: mockAIConfig,
				ttsProvider: {
					provider: 'browser'
				}
			}
		});

		mockUpdateAIAssistantConfig.mockResolvedValue({
			success: false,
			error: 'Database error'
		});

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const saveButton = screen.getByText('common.buttons.save');
			expect(saveButton).toBeInTheDocument();
		});

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Database error');
		});
	});

	it('should disable buttons during loading states', async () => {
		// Mock slow response
		mockTestTTSProviderConnection.mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
		);

		render(TTSProviderConfigPanel);

		await waitFor(() => {
			const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
			const saveButton = screen.getByText('common.buttons.save');
			expect(testButton).toBeInTheDocument();
			expect(saveButton).toBeInTheDocument();
		});

		const testButton = screen.getByText('settings.admin.ttsProvider.testVoice');
		const saveButton = screen.getByText('common.buttons.save');

		await fireEvent.click(testButton);

		// Buttons should be disabled during testing
		expect(testButton).toBeDisabled();
		expect(saveButton).toBeDisabled();
	});
});
