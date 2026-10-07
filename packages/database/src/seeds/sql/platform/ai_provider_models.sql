-- =============================================================================
-- AI PROVIDER MODELS - Az AI asszisztens beállításainál választható modellek
-- =============================================================================
-- Beépített modellek (is_builtin = true): nem törölhetők, csak letilthatók.
-- Újrafuttatáskor a név és a sorrend frissül, az admin döntései (letiltás,
-- alapértelmezett) megmaradnak. Új modell: vegyél fel egy sort, és futtasd a db:init-et,
-- vagy add hozzá a Beállítások → AI asszisztens oldalon.

INSERT INTO platform.ai_provider_models (provider_id, model_id, display_name, is_builtin, sort_order) VALUES
-- Google Gemini
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'gemini-3.8-flash', 'Gemini 3.8 Flash', true, 10),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'gemini-3.7-flash', 'Gemini 3.7 Flash', true, 20),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'gemini-3.6-flash', 'Gemini 3.6 Flash', true, 30),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', true, 40),
((SELECT id FROM platform.ai_providers WHERE name = 'gemini'), 'gemini-3.1-pro-preview', 'Gemini 3.1 Pro (preview)', true, 50),
-- Groq
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'openai/gpt-oss-120b', 'GPT-OSS 120B', true, 10),
((SELECT id FROM platform.ai_providers WHERE name = 'groq'), 'openai/gpt-oss-20b', 'GPT-OSS 20B', true, 20),
-- OpenAI
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'gpt-6-luna', 'GPT-6 Luna', true, 10),
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'gpt-6.1-sol', 'GPT-6.1 Sol', true, 20),
((SELECT id FROM platform.ai_providers WHERE name = 'openai'), 'gpt-6-astra', 'GPT-6 Astra', true, 30),
-- Anthropic
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'claude-opus-5-5', 'Claude Opus 5.5', true, 10),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'claude-sonnet-5-5', 'Claude Sonnet 5.5', true, 20),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'claude-haiku-4-5', 'Claude Haiku 4.5', true, 30),
((SELECT id FROM platform.ai_providers WHERE name = 'anthropic'), 'claude-fable-5-1', 'Claude Fable 5.1', true, 40),
-- Hugging Face
((SELECT id FROM platform.ai_providers WHERE name = 'huggingface'), 'mistralai/Mistral-7B-Instruct-v0.2', 'Mistral 7B Instruct v0.2', true, 10)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order = EXCLUDED.sort_order,
    is_builtin = true,
    updated_at = NOW();

-- Alapértelmezett modell providerenként — csak ha a providernek még nincs
UPDATE platform.ai_provider_models m
SET is_default = true, updated_at = NOW()
FROM platform.ai_providers p
WHERE m.provider_id = p.id
  AND (p.name, m.model_id) IN (
    ('gemini', 'gemini-3.8-flash'),
    ('groq', 'openai/gpt-oss-120b'),
    ('openai', 'gpt-6-luna'),
    ('anthropic', 'claude-opus-5-5'),
    ('huggingface', 'mistralai/Mistral-7B-Instruct-v0.2')
  )
  AND NOT EXISTS (
    SELECT 1 FROM platform.ai_provider_models d
    WHERE d.provider_id = m.provider_id AND d.is_default
  );
