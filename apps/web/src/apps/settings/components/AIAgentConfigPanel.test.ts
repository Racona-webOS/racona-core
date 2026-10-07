/**
 * AIAgentConfigPanel Component Tests
 *
 * Tests for the AI Agent configuration panel component.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { toast } from 'svelte-sonner';
import AIAgentConfigPanelHost from './AIAgentConfigPanel.test-host.svelte';

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
// A vi.mock factory a fájl tetejére hoistolódik, ezért a mockokat is
// vi.hoisted()-ben kell létrehozni — különben a factory olyan változóra
// hivatkozna, ami még nincs inicializálva.
const {
	mockGetAIAssistantConfig,
	mockUpdateAIAssistantConfig,
	mockTestAIAgentConnection,
	mockGetAIProviderCatalog,
	mockAddAIProviderModel,
	mockUpdateAIProviderModel,
	mockSetDefaultAIProviderModel,
	mockDeleteAIProviderModel
} = vi.hoisted(() => ({
	mockGetAIAssistantConfig: vi.fn(),
	mockUpdateAIAssistantConfig: vi.fn(),
	mockTestAIAgentConnection: vi.fn(),
	mockGetAIProviderCatalog: vi.fn(),
	mockAddAIProviderModel: vi.fn(),
	mockUpdateAIProviderModel: vi.fn(),
	mockSetDefaultAIProviderModel: vi.fn(),
	mockDeleteAIProviderModel: vi.fn()
}));

vi.mock('../admin-config.remote', () => ({
	getAIAssistantConfig: mockGetAIAssistantConfig,
	updateAIAssistantConfig: mockUpdateAIAssistantConfig,
	testAIAgentConnection: mockTestAIAgentConnection,
	getAIProviderCatalog: mockGetAIProviderCatalog,
	addAIProviderModel: mockAddAIProviderModel,
	updateAIProviderModel: mockUpdateAIProviderModel,
	setDefaultAIProviderModel: mockSetDefaultAIProviderModel,
	deleteAIProviderModel: mockDeleteAIProviderModel
}));

/** Egy modell a katalógusban */
function catalogModel(id: number, modelId: string, extra: Record<string, unknown> = {}) {
	return {
		id,
		providerId: 1,
		modelId,
		displayName: modelId.toUpperCase(),
		isDefault: false,
		isEnabled: true,
		isBuiltin: true,
		sortOrder: id * 10,
		createdAt: new Date(),
		updatedAt: new Date(),
		...extra
	};
}

/** Két provider modellistával és egy lista nélküli (egyéni endpoint) */
function catalog() {
	return {
		success: true,
		providers: [
			{
				name: 'openai',
				displayName: 'OpenAI',
				description: null,
				isRecommended: true,
				models: [
					catalogModel(1, 'gpt-6-luna', { isDefault: true }),
					catalogModel(2, 'gpt-6.1-sol'),
					catalogModel(3, 'gpt-old', { isEnabled: false }),
					catalogModel(4, 'my-model', { isBuiltin: false })
				]
			},
			{
				name: 'anthropic',
				displayName: 'Anthropic',
				description: null,
				isRecommended: false,
				models: [
					catalogModel(11, 'claude-sonnet-5-5'),
					catalogModel(12, 'claude-opus-5-5', { isDefault: true })
				]
			},
			{
				name: 'custom',
				displayName: 'Egyéni endpoint',
				description: null,
				isRecommended: false,
				models: []
			}
		]
	};
}

/**
 * Alapértelmezett konfiguráció a tesztekhez: engedélyezett AI Agent, üres
 * kulcs/modell mezőkkel.
 *
 * Az űrlap a komponensben az `{#if enabled}` ág mögött van, ezért a mezőket
 * vizsgáló tesztek csak engedélyezett állapotban látják őket. A mezők üresen
 * indulnak, hogy a kötelező mezők validációja is tesztelhető maradjon; az
 * advancedParams a komponens saját alapértékeit tükrözi.
 */
function enabledConfig(overrides: Record<string, unknown> = {}) {
	return {
		success: true,
		config: {
			enabled: true,
			aiAgent: {
				provider: 'openai',
				apiKeyEncrypted: '',
				model: '',
				baseUrl: '',
				advancedParams: {
					maxTokens: 2000,
					temperature: 0.7,
					topP: 0.9
				},
				...overrides
			}
		}
	};
}

/**
 * Egy csúszka fogantyúja (a bits-ui Slider a korlátokat ezen közli:
 * aria-valuemin / aria-valuemax / aria-valuenow).
 *
 * @param id - A Slider komponensre adott id.
 * @returns A fogantyú eleme, vagy null ha még nincs kirenderelve.
 */
function sliderThumb(id: string): HTMLElement | null {
	return document.querySelector(`#${id} [role="slider"]`);
}

describe('AIAgentConfigPanel', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default: engedélyezett, még kitöltetlen konfiguráció
		mockGetAIAssistantConfig.mockResolvedValue(enabledConfig());
		// Default: nincs modellkatalógus → szabad szöveges modellmező (a régi viselkedés)
		mockGetAIProviderCatalog.mockResolvedValue({ success: false });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render component with default state', async () => {
		render(AIAgentConfigPanelHost);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.aiAgent.title')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.aiAgent.description')).toBeInTheDocument();
			expect(screen.getByText('settings.admin.aiAgent.active')).toBeInTheDocument();
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

		render(AIAgentConfigPanelHost);

		await waitFor(() => {
			expect(screen.getByText('settings.admin.aiAgent.active')).toBeInTheDocument();
		});

		expect(mockGetAIAssistantConfig).toHaveBeenCalledOnce();
	});

	it('should handle provider selection', async () => {
		render(AIAgentConfigPanelHost);

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
		render(AIAgentConfigPanelHost);

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

		render(AIAgentConfigPanelHost);

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

		render(AIAgentConfigPanelHost);

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

	it('should constrain advanced parameters to the allowed ranges', async () => {
		render(AIAgentConfigPanelHost);

		await waitFor(() => {
			expect(sliderThumb('max-tokens')).toBeInTheDocument();
		});

		// A paraméterek csúszkák, nem szabadon írható mezők — a komponensben
		// megadott korlátok tartják őket érvényes tartományban. (A handleSave
		// tartomány-ellenőrzései megmaradnak, azok a felületet megkerülő
		// adatokra védenek.)
		expect(sliderThumb('max-tokens')).toHaveAttribute('aria-valuemin', '100');
		expect(sliderThumb('max-tokens')).toHaveAttribute('aria-valuemax', '100000');
		expect(sliderThumb('max-tokens')).toHaveAttribute('aria-valuenow', '2000');

		expect(sliderThumb('temperature')).toHaveAttribute('aria-valuemin', '0');
		expect(sliderThumb('temperature')).toHaveAttribute('aria-valuemax', '2');
		expect(sliderThumb('temperature')).toHaveAttribute('aria-valuenow', '0.7');

		expect(sliderThumb('top-p')).toHaveAttribute('aria-valuemin', '0');
		expect(sliderThumb('top-p')).toHaveAttribute('aria-valuemax', '1');
		expect(sliderThumb('top-p')).toHaveAttribute('aria-valuenow', '0.9');
	});

	it('should save configuration successfully', async () => {
		mockUpdateAIAssistantConfig.mockResolvedValue({
			success: true
		});

		render(AIAgentConfigPanelHost);

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
				enabled: true,
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

		render(AIAgentConfigPanelHost);

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

		render(AIAgentConfigPanelHost);

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

	describe('modellista', () => {
		beforeEach(() => {
			mockGetAIProviderCatalog.mockResolvedValue(catalog());
		});

		async function modelSelect() {
			return (await screen.findByLabelText('settings.admin.aiAgent.model')) as HTMLSelectElement;
		}

		it('a modellválasztóban a provider engedélyezett modelljei és az egyéni lehetőség szerepel', async () => {
			render(AIAgentConfigPanelHost);

			const select = await modelSelect();
			await waitFor(() => expect(select.tagName).toBe('SELECT'));
			const options = [...select.options].map((o) => o.value);
			expect(options).toEqual(['gpt-6-luna', 'gpt-6.1-sol', 'my-model', '__custom__']);
		});

		it('üres modellnél a provider alapértelmezett modelljét választja', async () => {
			render(AIAgentConfigPanelHost);

			const select = await modelSelect();
			await waitFor(() => expect(select.value).toBe('gpt-6-luna'));
		});

		it('providerváltáskor az új provider alapértelmezett modellje lesz kiválasztva', async () => {
			render(AIAgentConfigPanelHost);

			const providerSelect = (await screen.findByLabelText(
				'settings.admin.aiAgent.provider'
			)) as HTMLSelectElement;
			await waitFor(() => expect(providerSelect.options.length).toBe(3));

			await fireEvent.change(providerSelect, { target: { value: 'anthropic' } });

			await waitFor(async () => expect((await modelSelect()).value).toBe('claude-opus-5-5'));
		});

		it('a listában nem szereplő mentett modell egyéni modellként jelenik meg', async () => {
			mockGetAIAssistantConfig.mockResolvedValue({
				...enabledConfig({ model: 'gemini-2.5-flash' }),
				config: { ...enabledConfig({ model: 'gemini-2.5-flash' }).config, enabled: true }
			});
			render(AIAgentConfigPanelHost);

			const customInput = (await screen.findByLabelText(
				'settings.admin.aiAgent.customModelId'
			)) as HTMLInputElement;
			expect(customInput.value).toBe('gemini-2.5-flash');
			expect((await modelSelect()).value).toBe('__custom__');
		});

		it('lista nélküli providernél szabad szöveges mező marad', async () => {
			render(AIAgentConfigPanelHost);

			const providerSelect = (await screen.findByLabelText(
				'settings.admin.aiAgent.provider'
			)) as HTMLSelectElement;
			await waitFor(() => expect(providerSelect.options.length).toBe(3));
			await fireEvent.change(providerSelect, { target: { value: 'custom' } });

			await waitFor(async () => expect((await modelSelect()).tagName).toBe('INPUT'));
		});

		it('új modellt vesz fel a kiválasztott providerhez', async () => {
			mockAddAIProviderModel.mockResolvedValue({ success: true });
			render(AIAgentConfigPanelHost);

			const idInput = await screen.findByLabelText('settings.admin.aiAgent.models.newModelId');
			await fireEvent.input(idInput, { target: { value: 'gpt-6-astra' } });
			await fireEvent.click(screen.getByText('settings.admin.aiAgent.models.add'));

			await waitFor(() =>
				expect(mockAddAIProviderModel).toHaveBeenCalledWith({
					provider: 'openai',
					modelId: 'gpt-6-astra',
					displayName: 'gpt-6-astra'
				})
			);
			expect(toast.success).toHaveBeenCalledWith('settings.admin.aiAgent.models.addSuccess');
		});

		it('csak a saját modell törölhető', async () => {
			render(AIAgentConfigPanelHost);

			await screen.findAllByText('MY-MODEL');
			const deleteButtons = screen.getAllByLabelText('settings.admin.aiAgent.models.delete');
			expect(deleteButtons).toHaveLength(1);
		});
	});
});
