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
('hu', 'ai-assistant', 'input.tooLong', 'A kérdés túl hosszú (maximum {max} karakter).'),
('hu', 'ai-assistant', 'input.clearHistory', 'Beszélgetés törlése'),
('hu', 'ai-assistant', 'avatar.title', 'Avatar beállítások'),
('hu', 'ai-assistant', 'tts.title', 'Felolvasás beállítások'),
('hu', 'ai-assistant', 'tts.testButton', 'Teszt felolvasás')
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
('en', 'ai-assistant', 'input.tooLong', 'Question is too long (maximum {max} characters).'),
('en', 'ai-assistant', 'input.clearHistory', 'Clear conversation'),
('en', 'ai-assistant', 'avatar.title', 'Avatar Settings'),
('en', 'ai-assistant', 'tts.title', 'Text-to-Speech Settings'),
('en', 'ai-assistant', 'tts.testButton', 'Test Playback')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Menü és üdvözlő üzenetek (avatar management)
-- Requirements: 3.3, 3.4, 6.5, 6.6, 6.8
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'menu.settings', 'Beállítások'),
('hu', 'ai-assistant', 'greeting.hu', 'Szia, {name} vagyok, miben segíthetek?'),
('hu', 'ai-assistant', 'greeting.en', 'Szia, {name} vagyok, miben segíthetek?'),
('hu', 'ai-assistant', 'greeting.defaultName', 'Asszisztens'),
('hu', 'ai-assistant', 'settings.loading', 'Betöltés...'),
('hu', 'ai-assistant', 'settings.noAvatarSelected', 'Nincs asszisztens kiválasztva'),
('hu', 'ai-assistant', 'settings.selectFromBelow', 'Válassz az alábbi listából'),
('hu', 'ai-assistant', 'settings.selectAvatar', 'Avatar kiválasztása'),
('hu', 'ai-assistant', 'settings.customName', 'Egyéni név'),
('hu', 'ai-assistant', 'settings.quality', 'Minőség'),
('hu', 'ai-assistant', 'settings.save', 'Mentés'),
('hu', 'ai-assistant', 'settings.saving', 'Mentés...'),
('hu', 'ai-assistant', 'settings.cancel', 'Mégse'),
('hu', 'ai-assistant', 'settings.saveSuccess', 'Beállítások sikeresen mentve'),
('hu', 'ai-assistant', 'settings.saveError', 'Hiba történt a mentés során'),
('hu', 'ai-assistant', 'settings.installedAvatars', 'Telepített avatárok'),
('hu', 'ai-assistant', 'settings.noAvatarsInstalled', 'Még nincs telepített avatar'),
('hu', 'ai-assistant', 'settings.noAvatars', 'Nincs elérhető avatar')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'menu.settings', 'Settings'),
('en', 'ai-assistant', 'greeting.hu', 'Szia, {name} vagyok, miben segíthetek?'),
('en', 'ai-assistant', 'greeting.en', 'Hi, I''m {name}, how can I help you?'),
('en', 'ai-assistant', 'greeting.defaultName', 'Assistant'),
('en', 'ai-assistant', 'settings.loading', 'Loading...'),
('en', 'ai-assistant', 'settings.noAvatarSelected', 'No assistant selected'),
('en', 'ai-assistant', 'settings.selectFromBelow', 'Select from the list below'),
('en', 'ai-assistant', 'settings.selectAvatar', 'Select avatar'),
('en', 'ai-assistant', 'settings.customName', 'Custom name'),
('en', 'ai-assistant', 'settings.quality', 'Quality'),
('en', 'ai-assistant', 'settings.save', 'Save'),
('en', 'ai-assistant', 'settings.saving', 'Saving...'),
('en', 'ai-assistant', 'settings.cancel', 'Cancel'),
('en', 'ai-assistant', 'settings.saveSuccess', 'Settings saved successfully'),
('en', 'ai-assistant', 'settings.saveError', 'Error saving settings'),
('en', 'ai-assistant', 'settings.installedAvatars', 'Installed avatars'),
('en', 'ai-assistant', 'settings.noAvatarsInstalled', 'No avatars installed yet'),
('en', 'ai-assistant', 'settings.noAvatars', 'No avatars available')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Agent beállítások (agent settings) fordítások - MAGYAR
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'agent.loading', 'Betöltés...'),
('hu', 'ai-assistant', 'agent.provider', 'AI szolgáltató'),
('hu', 'ai-assistant', 'agent.selectProvider', 'Válassz szolgáltatót'),
('hu', 'ai-assistant', 'agent.recommended', 'ajánlott'),
('hu', 'ai-assistant', 'agent.apiKey', 'API kulcs'),
('hu', 'ai-assistant', 'agent.apiKeyPlaceholder', 'Írd be az API kulcsot'),
('hu', 'ai-assistant', 'agent.apiKeyHint', 'Az API kulcs titkosítva lesz tárolva az adatbázisban'),
('hu', 'ai-assistant', 'agent.showApiKey', 'API kulcs megjelenítése'),
('hu', 'ai-assistant', 'agent.hideApiKey', 'API kulcs elrejtése'),
('hu', 'ai-assistant', 'agent.modelName', 'Model név'),
('hu', 'ai-assistant', 'agent.modelNamePlaceholder', 'pl. gemini-2.5-flash'),
('hu', 'ai-assistant', 'agent.modelNameHint', 'Opcionális. Ha üresen hagyod, az alapértelmezett modellt használja'),
('hu', 'ai-assistant', 'agent.showAdvanced', 'Haladó beállítások megjelenítése'),
('hu', 'ai-assistant', 'agent.hideAdvanced', 'Haladó beállítások elrejtése'),
('hu', 'ai-assistant', 'agent.baseUrl', 'Alap URL'),
('hu', 'ai-assistant', 'agent.baseUrlPlaceholder', 'https://api.example.com'),
('hu', 'ai-assistant', 'agent.baseUrlHint', 'Opcionális. Egyéni API végpont megadásához'),
('hu', 'ai-assistant', 'agent.maxTokens', 'Maximum tokenek'),
('hu', 'ai-assistant', 'agent.temperature', 'Kreativitás'),
('hu', 'ai-assistant', 'agent.testConnection', 'Kapcsolat tesztelése'),
('hu', 'ai-assistant', 'agent.testing', 'Tesztelés...'),
('hu', 'ai-assistant', 'agent.cancel', 'Mégse'),
('hu', 'ai-assistant', 'agent.save', 'Mentés'),
('hu', 'ai-assistant', 'agent.saving', 'Mentés...'),
('hu', 'ai-assistant', 'agent.loadError', 'Hiba történt a konfiguráció betöltése során'),
('hu', 'ai-assistant', 'agent.saveSuccess', 'Konfiguráció sikeresen mentve'),
('hu', 'ai-assistant', 'agent.saveError', 'Hiba történt a mentés során'),
('hu', 'ai-assistant', 'agent.apiKeyRequired', 'Az API kulcs megadása kötelező'),
('hu', 'ai-assistant', 'agent.testSuccess', 'A kapcsolat sikeresen tesztelve'),
('hu', 'ai-assistant', 'agent.testError', 'Hiba történt a kapcsolat tesztelése során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Agent beállítások (agent settings) fordítások - ANGOL
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'agent.loading', 'Loading...'),
('en', 'ai-assistant', 'agent.provider', 'AI Provider'),
('en', 'ai-assistant', 'agent.selectProvider', 'Select provider'),
('en', 'ai-assistant', 'agent.recommended', 'recommended'),
('en', 'ai-assistant', 'agent.apiKey', 'API Key'),
('en', 'ai-assistant', 'agent.apiKeyPlaceholder', 'Enter your API key'),
('en', 'ai-assistant', 'agent.apiKeyHint', 'The API key will be stored encrypted in the database'),
('en', 'ai-assistant', 'agent.showApiKey', 'Show API key'),
('en', 'ai-assistant', 'agent.hideApiKey', 'Hide API key'),
('en', 'ai-assistant', 'agent.modelName', 'Model Name'),
('en', 'ai-assistant', 'agent.modelNamePlaceholder', 'e.g. gemini-2.5-flash'),
('en', 'ai-assistant', 'agent.modelNameHint', 'Optional. If left empty, the default model will be used'),
('en', 'ai-assistant', 'agent.showAdvanced', 'Show advanced settings'),
('en', 'ai-assistant', 'agent.hideAdvanced', 'Hide advanced settings'),
('en', 'ai-assistant', 'agent.baseUrl', 'Base URL'),
('en', 'ai-assistant', 'agent.baseUrlPlaceholder', 'https://api.example.com'),
('en', 'ai-assistant', 'agent.baseUrlHint', 'Optional. For custom API endpoints'),
('en', 'ai-assistant', 'agent.maxTokens', 'Max Tokens'),
('en', 'ai-assistant', 'agent.temperature', 'Temperature'),
('en', 'ai-assistant', 'agent.testConnection', 'Test Connection'),
('en', 'ai-assistant', 'agent.testing', 'Testing...'),
('en', 'ai-assistant', 'agent.cancel', 'Cancel'),
('en', 'ai-assistant', 'agent.save', 'Save'),
('en', 'ai-assistant', 'agent.saving', 'Saving...'),
('en', 'ai-assistant', 'agent.loadError', 'Error loading configuration'),
('en', 'ai-assistant', 'agent.saveSuccess', 'Configuration saved successfully'),
('en', 'ai-assistant', 'agent.saveError', 'Error saving configuration'),
('en', 'ai-assistant', 'agent.apiKeyRequired', 'API key is required'),
('en', 'ai-assistant', 'agent.testSuccess', 'Connection tested successfully'),
('en', 'ai-assistant', 'agent.testError', 'Error testing connection')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
-- -----------------------------------------------------------------------------
-- Knowledge Base admin fordítások - MAGYAR
-- Requirements: 3.4, 3.5, 18.1
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'knowledgeBase.loading', 'Betöltés...'),
('hu', 'ai-assistant', 'knowledgeBase.statusLoadError', 'Hiba történt a státusz betöltése során'),
('hu', 'ai-assistant', 'knowledgeBase.reindexSuccess', 'Újraindexelés sikeresen befejezve'),
('hu', 'ai-assistant', 'knowledgeBase.reindexError', 'Hiba történt az újraindexelés során'),
('hu', 'ai-assistant', 'knowledgeBase.neverIndexed', 'Soha'),
('hu', 'ai-assistant', 'knowledgeBase.totalDocuments', 'Összes dokumentum'),
('hu', 'ai-assistant', 'knowledgeBase.totalChunks', 'Összes chunk'),
('hu', 'ai-assistant', 'knowledgeBase.uptime', 'Üzemidő'),
('hu', 'ai-assistant', 'knowledgeBase.languageDetails', 'Nyelvi részletek'),
('hu', 'ai-assistant', 'knowledgeBase.loaded', 'Betöltve'),
('hu', 'ai-assistant', 'knowledgeBase.notLoaded', 'Nincs betöltve'),
('hu', 'ai-assistant', 'knowledgeBase.reindexing', 'Újraindexelés...'),
('hu', 'ai-assistant', 'knowledgeBase.reindexLanguage', 'Újraindexelés'),
('hu', 'ai-assistant', 'knowledgeBase.documents', 'Dokumentumok'),
('hu', 'ai-assistant', 'knowledgeBase.chunks', 'Chunk-ok'),
('hu', 'ai-assistant', 'knowledgeBase.lastIndexed', 'Utolsó indexelés'),
('hu', 'ai-assistant', 'knowledgeBase.reindexingAll', 'Összes újraindexelése...'),
('hu', 'ai-assistant', 'knowledgeBase.reindexAll', 'Összes újraindexelése'),
('hu', 'ai-assistant', 'knowledgeBase.refreshStatus', 'Státusz frissítése'),
('hu', 'ai-assistant', 'knowledgeBase.statusUnavailable', 'A státusz nem elérhető'),
('hu', 'ai-assistant', 'knowledgeBase.retry', 'Újrapróbálás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Knowledge Base admin fordítások - ANGOL
-- Requirements: 3.4, 3.5, 18.1
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'knowledgeBase.loading', 'Loading...'),
('en', 'ai-assistant', 'knowledgeBase.statusLoadError', 'Error loading status'),
('en', 'ai-assistant', 'knowledgeBase.reindexSuccess', 'Reindexing completed successfully'),
('en', 'ai-assistant', 'knowledgeBase.reindexError', 'Error during reindexing'),
('en', 'ai-assistant', 'knowledgeBase.neverIndexed', 'Never'),
('en', 'ai-assistant', 'knowledgeBase.totalDocuments', 'Total Documents'),
('en', 'ai-assistant', 'knowledgeBase.totalChunks', 'Total Chunks'),
('en', 'ai-assistant', 'knowledgeBase.uptime', 'Uptime'),
('en', 'ai-assistant', 'knowledgeBase.languageDetails', 'Language Details'),
('en', 'ai-assistant', 'knowledgeBase.loaded', 'Loaded'),
('en', 'ai-assistant', 'knowledgeBase.notLoaded', 'Not Loaded'),
('en', 'ai-assistant', 'knowledgeBase.reindexing', 'Reindexing...'),
('en', 'ai-assistant', 'knowledgeBase.reindexLanguage', 'Reindex'),
('en', 'ai-assistant', 'knowledgeBase.documents', 'Documents'),
('en', 'ai-assistant', 'knowledgeBase.chunks', 'Chunks'),
('en', 'ai-assistant', 'knowledgeBase.lastIndexed', 'Last Indexed'),
('en', 'ai-assistant', 'knowledgeBase.reindexingAll', 'Reindexing All...'),
('en', 'ai-assistant', 'knowledgeBase.reindexAll', 'Reindex All'),
('en', 'ai-assistant', 'knowledgeBase.refreshStatus', 'Refresh Status'),
('en', 'ai-assistant', 'knowledgeBase.statusUnavailable', 'Status unavailable'),
('en', 'ai-assistant', 'knowledgeBase.retry', 'Retry')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
-- -----------------------------------------------------------------------------
-- Agent Settings tab címek - MAGYAR
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'agent.title', 'AI Agent'),
('hu', 'ai-assistant', 'knowledgeBase.title', 'Tudásbázis')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Agent Settings tab címek - ANGOL
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'agent.title', 'AI Agent'),
('en', 'ai-assistant', 'knowledgeBase.title', 'Knowledge Base')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- TTS (Text-to-Speech) beállítások fordítások - MAGYAR
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'ai-assistant', 'tts.title', 'Felolvasás'),
('hu', 'ai-assistant', 'tts.loading', 'Betöltés...'),
('hu', 'ai-assistant', 'tts.testText', 'Üdvözöllek! Ez egy teszt üzenet a felolvasás kipróbálásához.'),
('hu', 'ai-assistant', 'tts.disabled.title', 'TTS szolgáltatás letiltva'),
('hu', 'ai-assistant', 'tts.disabled.message', 'A felolvasás funkció jelenleg le van tiltva. Kérj meg egy adminisztrátort, hogy engedélyezze a Settings appban.'),
('hu', 'ai-assistant', 'tts.userEnabled.label', 'Felolvasás engedélyezése'),
('hu', 'ai-assistant', 'tts.userEnabled.hint', 'Kikapcsolhatod a felolvasást, ha nem szeretnéd használni'),
('hu', 'ai-assistant', 'tts.provider.label', 'Szolgáltató'),
('hu', 'ai-assistant', 'tts.provider.browser', 'Böngésző (Web Speech API)'),
('hu', 'ai-assistant', 'tts.provider.elevenlabs', 'ElevenLabs'),
('hu', 'ai-assistant', 'tts.provider.note', 'A szolgáltatót és az API kulcsot az adminisztrátor állítja be a Settings appban.'),
('hu', 'ai-assistant', 'tts.voice.label', 'Hang (opcionális felülbírálás)'),
('hu', 'ai-assistant', 'tts.voice.default', 'Alapértelmezett (admin beállítás)'),
('hu', 'ai-assistant', 'tts.voice.defaultMarker', 'alapértelmezett'),
('hu', 'ai-assistant', 'tts.voice.hint', 'Ha nem választasz hangot, az admin által beállított alapértelmezett hang lesz használva.'),
('hu', 'ai-assistant', 'tts.rate.label', 'Sebesség'),
('hu', 'ai-assistant', 'tts.rate.range', '0.5x - 2x'),
('hu', 'ai-assistant', 'tts.pitch.label', 'Hangmagasság'),
('hu', 'ai-assistant', 'tts.pitch.range', '0.5 - 2'),
('hu', 'ai-assistant', 'tts.volume.label', 'Hangerő'),
('hu', 'ai-assistant', 'tts.volume.range', '0% - 100%'),
('hu', 'ai-assistant', 'tts.volume.hint', 'Felolvasás hangereje'),
('hu', 'ai-assistant', 'tts.autoPlay.label', 'Automatikus felolvasás'),
('hu', 'ai-assistant', 'tts.autoPlay.hint', 'Automatikusan felolvassa az új asszisztens válaszokat'),
('hu', 'ai-assistant', 'tts.errors.loadFailed', 'Beállítások betöltése sikertelen'),
('hu', 'ai-assistant', 'tts.errors.saveFailed', 'Mentés sikertelen'),
('hu', 'ai-assistant', 'tts.errors.notSupported', 'A böngésző nem támogatja a felolvasást'),
('hu', 'ai-assistant', 'tts.errors.elevenLabsKeyMissing', 'ElevenLabs API kulcs hiányzik (admin beállítás)'),
('hu', 'ai-assistant', 'tts.notSupported', 'A böngésző nem támogatja a felolvasást (Web Speech API).'),
('hu', 'ai-assistant', 'tts.enabled', 'Felolvasás engedélyezése'),
('hu', 'ai-assistant', 'tts.enabledHint', 'Megjeleníti a felolvasás gombot az asszisztens üzeneteinél'),
('hu', 'ai-assistant', 'tts.autoPlay', 'Automatikus felolvasás'),
('hu', 'ai-assistant', 'tts.autoPlayHint', 'Automatikusan felolvassa az új asszisztens válaszokat'),
('hu', 'ai-assistant', 'tts.provider', 'Szolgáltató'),
('hu', 'ai-assistant', 'tts.providerBrowser', 'Böngésző (Web Speech API) - Ingyenes'),
('hu', 'ai-assistant', 'tts.providerElevenLabs', 'ElevenLabs - Prémium minőség'),
('hu', 'ai-assistant', 'tts.voice', 'Hang'),
('hu', 'ai-assistant', 'tts.voiceHint', 'Válassz hangot a felolvasáshoz (magyar hang ajánlott)'),
('hu', 'ai-assistant', 'tts.rate', 'Sebesség'),
('hu', 'ai-assistant', 'tts.rateHint', 'Felolvasás sebessége (0.5x = lassú, 2x = gyors)'),
('hu', 'ai-assistant', 'tts.pitch', 'Hangmagasság'),
('hu', 'ai-assistant', 'tts.pitchHint', 'Hang magassága (0.5 = mély, 2 = magas)'),
('hu', 'ai-assistant', 'tts.volume', 'Hangerő'),
('hu', 'ai-assistant', 'tts.volumeHint', 'Felolvasás hangereje'),
('hu', 'ai-assistant', 'tts.test', 'Teszt felolvasás'),
('hu', 'ai-assistant', 'tts.saveSuccess', 'Beállítások mentve'),
('hu', 'ai-assistant', 'tts.saveError', 'Mentés sikertelen'),
('hu', 'ai-assistant', 'tts.loadError', 'Beállítások betöltése sikertelen'),
('hu', 'ai-assistant', 'tts.speak', 'Felolvasás'),
('hu', 'ai-assistant', 'tts.pause', 'Szüneteltetés'),
('hu', 'ai-assistant', 'tts.resume', 'Folytatás'),
('hu', 'ai-assistant', 'tts.stop', 'Leállítás'),
('hu', 'ai-assistant', 'tts.elevenLabsApiKey', 'ElevenLabs API kulcs'),
('hu', 'ai-assistant', 'tts.elevenLabsApiKeyHint', 'Szerezz API kulcsot: elevenlabs.io'),
('hu', 'ai-assistant', 'tts.loadVoices', 'Hangok betöltése'),
('hu', 'ai-assistant', 'tts.loadingVoices', 'Betöltés...'),
('hu', 'ai-assistant', 'tts.voicesLoaded', '{count} hang betöltve'),
('hu', 'ai-assistant', 'tts.apiKeyRequired', 'Először add meg az ElevenLabs API kulcsot')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- TTS (Text-to-Speech) beállítások fordítások - ANGOL
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'ai-assistant', 'tts.title', 'Text-to-Speech'),
('en', 'ai-assistant', 'tts.loading', 'Loading...'),
('en', 'ai-assistant', 'tts.testText', 'Hello! This is a test message to try out the text-to-speech feature.'),
('en', 'ai-assistant', 'tts.disabled.title', 'TTS Service Disabled'),
('en', 'ai-assistant', 'tts.disabled.message', 'The text-to-speech feature is currently disabled. Please ask an administrator to enable it in the Settings app.'),
('en', 'ai-assistant', 'tts.userEnabled.label', 'Enable text-to-speech'),
('en', 'ai-assistant', 'tts.userEnabled.hint', 'You can disable text-to-speech if you don''t want to use it'),
('en', 'ai-assistant', 'tts.provider.label', 'Provider'),
('en', 'ai-assistant', 'tts.provider.browser', 'Browser (Web Speech API)'),
('en', 'ai-assistant', 'tts.provider.elevenlabs', 'ElevenLabs'),
('en', 'ai-assistant', 'tts.provider.note', 'The provider and API key are configured by the administrator in the Settings app.'),
('en', 'ai-assistant', 'tts.voice.label', 'Voice (optional override)'),
('en', 'ai-assistant', 'tts.voice.default', 'Default (admin setting)'),
('en', 'ai-assistant', 'tts.voice.defaultMarker', 'default'),
('en', 'ai-assistant', 'tts.voice.hint', 'If no voice is selected, the default voice set by the administrator will be used.'),
('en', 'ai-assistant', 'tts.rate.label', 'Speed'),
('en', 'ai-assistant', 'tts.rate.range', '0.5x - 2x'),
('en', 'ai-assistant', 'tts.pitch.label', 'Pitch'),
('en', 'ai-assistant', 'tts.pitch.range', '0.5 - 2'),
('en', 'ai-assistant', 'tts.volume.label', 'Volume'),
('en', 'ai-assistant', 'tts.volume.range', '0% - 100%'),
('en', 'ai-assistant', 'tts.volume.hint', 'Speech volume'),
('en', 'ai-assistant', 'tts.autoPlay.label', 'Auto-play'),
('en', 'ai-assistant', 'tts.autoPlay.hint', 'Automatically reads new assistant responses'),
('en', 'ai-assistant', 'tts.errors.loadFailed', 'Failed to load settings'),
('en', 'ai-assistant', 'tts.errors.saveFailed', 'Failed to save'),
('en', 'ai-assistant', 'tts.errors.notSupported', 'Your browser does not support text-to-speech'),
('en', 'ai-assistant', 'tts.errors.elevenLabsKeyMissing', 'ElevenLabs API key is missing (admin setting)'),
('en', 'ai-assistant', 'tts.notSupported', 'Your browser does not support text-to-speech (Web Speech API).'),
('en', 'ai-assistant', 'tts.enabled', 'Enable text-to-speech'),
('en', 'ai-assistant', 'tts.enabledHint', 'Shows the speak button on assistant messages'),
('en', 'ai-assistant', 'tts.autoPlay', 'Auto-play'),
('en', 'ai-assistant', 'tts.autoPlayHint', 'Automatically reads new assistant responses'),
('en', 'ai-assistant', 'tts.provider', 'Provider'),
('en', 'ai-assistant', 'tts.providerBrowser', 'Browser (Web Speech API) - Free'),
('en', 'ai-assistant', 'tts.providerElevenLabs', 'ElevenLabs - Premium Quality'),
('en', 'ai-assistant', 'tts.voice', 'Voice'),
('en', 'ai-assistant', 'tts.voiceHint', 'Select a voice for text-to-speech'),
('en', 'ai-assistant', 'tts.rate', 'Speed'),
('en', 'ai-assistant', 'tts.rateHint', 'Speech rate (0.5x = slow, 2x = fast)'),
('en', 'ai-assistant', 'tts.pitch', 'Pitch'),
('en', 'ai-assistant', 'tts.pitchHint', 'Voice pitch (0.5 = low, 2 = high)'),
('en', 'ai-assistant', 'tts.volume', 'Volume'),
('en', 'ai-assistant', 'tts.volumeHint', 'Speech volume'),
('en', 'ai-assistant', 'tts.test', 'Test speech'),
('en', 'ai-assistant', 'tts.saveSuccess', 'Settings saved'),
('en', 'ai-assistant', 'tts.saveError', 'Failed to save settings'),
('en', 'ai-assistant', 'tts.loadError', 'Failed to load settings'),
('en', 'ai-assistant', 'tts.speak', 'Speak'),
('en', 'ai-assistant', 'tts.pause', 'Pause'),
('en', 'ai-assistant', 'tts.resume', 'Resume'),
('en', 'ai-assistant', 'tts.stop', 'Stop'),
('en', 'ai-assistant', 'tts.elevenLabsApiKey', 'ElevenLabs API Key'),
('en', 'ai-assistant', 'tts.elevenLabsApiKeyHint', 'Get API key at: elevenlabs.io'),
('en', 'ai-assistant', 'tts.loadVoices', 'Load Voices'),
('en', 'ai-assistant', 'tts.loadingVoices', 'Loading...'),
('en', 'ai-assistant', 'tts.voicesLoaded', '{count} voices loaded'),
('en', 'ai-assistant', 'tts.apiKeyRequired', 'Please enter ElevenLabs API key first')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();