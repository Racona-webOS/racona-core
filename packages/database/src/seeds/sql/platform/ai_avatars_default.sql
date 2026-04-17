-- =============================================================================
-- AI AVATARS DEFAULT - Alapértelmezett AI avatar betöltése
-- =============================================================================

-- Alapértelmezett "Rico" avatar beszúrása
INSERT INTO platform.ai_avatars (idname, display_name, manifest, available_qualities) VALUES
(
    'default',
    'Rico',
    '{"descriptions": {"hu": "Alapértelmezett AI asszisztens", "en": "Default AI assistant."}}',
    '["sd"]'
)
ON CONFLICT (idname) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    manifest = EXCLUDED.manifest,
    available_qualities = EXCLUDED.available_qualities,
    installed_at = NOW();