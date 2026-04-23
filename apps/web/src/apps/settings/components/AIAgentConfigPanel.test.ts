/**
 * AIAgentConfigPanel Component Tests
 *
 * Tests for the AI Agent configuration panel component.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { toast } from 'svelte-sonner';
import AIAgentConfigPanel from './AIAgentConfigPanel.svelte';

// Mock dependencies
vi.mock('svelte-sonner', () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn()
	}
}));

vi.mock('$lib/i18n/hooks', () => ({
	useI18n: () => ({
		t: (key: string) => key
	})
}));

// Mock remote functions
const mockGetAIAssistantConfig = vi.fn();
const mockUpdateAIAssistantConfig = vi.fn();
const mockTestAIAgentConnection = vi.fn();

vi.mock('../admin-config.remote', () => ({
	getAIAssistantConfig: mockGetAIAssistantConfig,
	updateAIAssistantConfig: mockUpdateAIAssistantConfig,
	testAIAgentConnection: mockTestAIAgentConnection
}));

describe('AIAgentConfigPanel', () => {
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
		render(AIAgentConfigPanel);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.aiAgent.title')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.aiAgent.description')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.aiAgent.inactive')).toBeInTheDocument();
		});
	});

	it('should load existing configuration on mount', async () => {
		const mockConfig = {
			success: true,
			config: {
				aiAgent: {
					provider: 'openai',
					apiKeyEncrypted: 'sk-***1234',
					model: 'gpt-4',
					baseUrl: 'https://api.openai.com/v1',
					advancedParams: {
						maxTokens: 2000,
						temperature: 0.7,
						topP: 0.9
					}
				}
			}
		};

		mockGetAIAssistantConfig.mockResolvedValue(mockConfig);

		render(AIAgentConfigPanel);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.aiAgent.active')).toBeInTheDocument();
		});

		expect(mockGetAIAssistantConfig).toHaveBeenCalledOnce();
	});

	it('should handle provider selection', async () => {
		render(AIAgentConfigPanel);

		await waitFor(() => {
			const providerSelect = screen.getByLabelText('settings.admin.aiAgent.provider');
			expect(providerSelect).toBeInTheDocument();
		});

		const providerSelect = screen.getByLabelText(
			'settings.admin.aiAgent.provider'
		) as HTMLSelectElement;

		await fireEvent.change(providerSelect, { target: { value: 'anthropic' } });

		expect(providerSelect.value).toBe('anthropic');
	});

	it('should validate required fields before testing connection', async () => {
		render(AIAgentConfigPanel);

		await waitFor(() => {
			const testButton = screen.getByText('settings.admin.aiAgent.testConnection');
			expect(testButton).toBeInTheDocument();
		});

		const testButton = screen.getByText('settings.admin.aiAgent.testConnection');
		await fireEvent.click(testButton);

		expect(toast.error).toHaveBeenCalledWith('settings.admin.aiAgent.validation.required');
		expect(mockTestAIAgentConnection).not.toHaveBeenCalled();
	});

	it('should test connection with valid data', async () => {
		mockTestAIAgentConnection.mockResolvedValue({
			success: true,
			message: 'Connection successful'
		});

		render(AIAgentConfigPanel);

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
			const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
			expect(apiKeyInput).toBeInTheDocument();
			expect(modelInput).toBeInTheDocument();
		});

		// Fill in required fields
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');

		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const testButton = screen.getByText('settings.admin.aiAgent.testConnection');
		await fireEvent.click(testButton);

		await waitFor(() => {
			expect(mockTestAIAgentConnection).toHaveBeenCalledWith({
				provider: 'openai',
				apiKey: 'sk-test123',
				model: 'gpt-4',
				baseUrl: undefined
			});
		});

		expect(toast.success).toHaveBeenCalledWith('Connection successful');
	});

	it('should handle connection test failure', async () => {
		mockTestAIAgentConnection.mockResolvedValue({
			success: false,
			error: 'Invalid API key'
		});

		render(AIAgentConfigPanel);

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
			const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
			expect(apiKeyInput).toBeInTheDocument();
			expect(modelInput).toBeInTheDocument();
		});

		// Fill in required fields
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');

		await fireEvent.input(apiKeyInput, { target: { value: 'sk-invalid' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const testButton = screen.getByText('settings.admin.aiAgent.testConnection');
		await fireEvent.click(testButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Invalid API key');
		});
	});

	it('should validate advanced parameters', async () => {
		render(AIAgentConfigPanel);

		await waitFor(() => {
			const maxTokensInput = screen.getByLabelText('settings.admin.aiAgent.maxTokens');
			const temperatureInput = screen.getByLabelText('settings.admin.aiAgent.temperature');
			const topPInput = screen.getByLabelText('settings.admin.aiAgent.topP');
			expect(maxTokensInput).toBeInTheDocument();
			expect(temperatureInput).toBeInTheDocument();
			expect(topPInput).toBeInTheDocument();
		});

		// Test invalid values
		const maxTokensInput = screen.getByLabelText('settings.admin.aiAgent.maxTokens');
		const temperatureInput = screen.getByLabelText('settings.admin.aiAgent.temperature');
		const topPInput = screen.getByLabelText('settings.admin.aiAgent.topP');

		await fireEvent.input(maxTokensInput, { target: { value: '0' } });
		await fireEvent.input(temperatureInput, { target: { value: '3' } });
		await fireEvent.input(topPInput, { target: { value: '2' } });

		// Fill required fields
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		// Should show validation errors
		expect(toast.error).toHaveBeenCalledWith('settings.admin.aiAgent.validation.maxTokensRange');
	});

	it('should save configuration successfully', async () => {
		mockUpdateAIAssistantConfig.mockResolvedValue({
			success: true
		});

		render(AIAgentConfigPanel);

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
			const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
			expect(apiKeyInput).toBeInTheDocument();
			expect(modelInput).toBeInTheDocument();
		});

		// Fill in valid data
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');

		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(mockUpdateAIAssistantConfig).toHaveBeenCalledWith({
				aiAgent: {
					provider: 'openai',
					apiKey: 'sk-test123',
					model: 'gpt-4',
					baseUrl: undefined,
					advancedParams: {
						maxTokens: 2000,
						temperature: 0.7,
						topP: 0.9
					}
				},
				ttsProvider: {
					provider: 'browser'
				}
			});
		});

		expect(toast.success).toHaveBeenCalledWith('settings.admin.aiAgent.saveSuccess');
	});

	it('should handle save errors', async () => {
		mockUpdateAIAssistantConfig.mockResolvedValue({
			success: false,
			error: 'Database error'
		});

		render(AIAgentConfigPanel);

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
			const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
			expect(apiKeyInput).toBeInTheDocument();
			expect(modelInput).toBeInTheDocument();
		});

		// Fill in required fields
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');

		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const saveButton = screen.getByText('common.buttons.save');
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Database error');
		});
	});

	it('should disable buttons during loading states', async () => {
		// Mock slow response
		mockTestAIAgentConnection.mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
		);

		render(AIAgentConfigPanel);

		await waitFor(() => {
			const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
			const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');
			expect(apiKeyInput).toBeInTheDocument();
			expect(modelInput).toBeInTheDocument();
		});

		// Fill in required fields
		const apiKeyInput = screen.getByLabelText('settings.admin.aiAgent.apiKey');
		const modelInput = screen.getByLabelText('settings.admin.aiAgent.model');

		await fireEvent.input(apiKeyInput, { target: { value: 'sk-test123' } });
		await fireEvent.input(modelInput, { target: { value: 'gpt-4' } });

		const testButton = screen.getByText('settings.admin.aiAgent.testConnection');
		const saveButton = screen.getByText('common.buttons.save');

		await fireEvent.click(testButton);

		// Buttons should be disabled during testing
		expect(testButton).toBeDisabled();
		expect(saveButton).toBeDisabled();
	});
});
