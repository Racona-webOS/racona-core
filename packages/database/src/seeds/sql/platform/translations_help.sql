-- =============================================================================
-- HELP NAMESPACE - Súgó alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'help', 'notFound', 'Nem található ilyen súgó oldal.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'help', 'notFound', 'Help page not found.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
