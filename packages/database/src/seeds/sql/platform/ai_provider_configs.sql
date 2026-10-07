-- =============================================================================
-- AI PROVIDER CONFIGS - AI szolgáltatók konfigurációs értékei
-- =============================================================================

-- Gemini provider konfigurációk
INSERT INTO platform.ai_provider_configs (provider_id, config_key, config_value, config_type, is_required) VALUES
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'default_model', 'gemini-3.8-flash', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'base_url', 'https://generativelanguage.googleapis.com/v1beta/models', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'temperature', '0.70', 'string', false),

-- Groq provider konfigurációk
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'default_model', 'openai/gpt-oss-120b', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'base_url', 'https://api.groq.com/openai/v1/chat/completions', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'temperature', '0.70', 'string', false),

-- OpenAI provider konfigurációk
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'default_model', 'gpt-6-luna', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'base_url', 'https://api.openai.com/v1/chat/completions', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'temperature', '0.70', 'string', false),

-- Anthropic provider konfigurációk
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'default_model', 'claude-opus-5-5', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'base_url', 'https://api.anthropic.com/v1/messages', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'temperature', '0.70', 'string', false),

-- Hugging Face provider konfigurációk
((SELECT id FROM platform.ai_providers WHERE name = 'huggingface'), 'default_model', 'mistralai/Mistral-7B-Instruct-v0.2', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'huggingface'), 'base_url', 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'huggingface'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'huggingface'), 'temperature', '0.70', 'string', false),

-- Custom provider konfigurációk
((SELECT id FROM platform.ai_providers WHERE name = 'custom'), 'default_model', 'default', 'string', false),
((SELECT id FROM platform.ai_providers WHERE name = 'custom'), 'max_tokens', '1000', 'number', false),
((SELECT id FROM platform.ai_providers WHERE name = 'custom'), 'temperature', '0.70', 'string', false)

ON CONFLICT (provider_id, config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    config_type = EXCLUDED.config_type,
    is_required = EXCLUDED.is_required;