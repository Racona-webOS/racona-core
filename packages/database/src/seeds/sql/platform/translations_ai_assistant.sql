-- =============================================================================
-- AI-ASSISTANT NAMESPACE - AI Asszisztens fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'panel.title', 'AI Asszisztens'),
('hu', 'ai-assistant', 'taskbar.label', 'AI Asszisztens'),
('hu', 'ai-assistant', 'emotion.label', 'Érzelem választó'),
('hu', 'ai-assistant', 'history.label', 'Beszélgetési előzmények'),
('hu', 'ai-assistant', 'history.empty', 'Tedd fel az első kérdésedet!'),
('hu', 'ai-assistant', 'loading', 'Válasz betöltése...'),
('hu', 'ai-assistant', 'input.placeholder', 'Mi a helyzet?'),
('hu', 'ai-assistant', 'input.label', 'Kérdés beviteli mező'),
('hu', 'ai-assistant', 'input.send', 'Küldés'),
('hu', 'ai-assistant', 'input.tooLong', 'A kérdés túl hosszú (maximum {max} karakter).')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'panel.title', 'AI Assistant'),
('en', 'ai-assistant', 'taskbar.label', 'AI Assistant'),
('en', 'ai-assistant', 'emotion.label', 'Emotion selector'),
('en', 'ai-assistant', 'history.label', 'Conversation history'),
('en', 'ai-assistant', 'history.empty', 'Ask your first question!'),
('en', 'ai-assistant', 'loading', 'Loading response...'),
('en', 'ai-assistant', 'input.placeholder', 'Ask something...'),
('en', 'ai-assistant', 'input.label', 'Question input field'),
('en', 'ai-assistant', 'input.send', 'Send'),
('en', 'ai-assistant', 'input.tooLong', 'Question is too long (maximum {max} characters).')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
