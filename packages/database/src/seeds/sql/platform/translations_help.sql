-- =============================================================================
-- HELP NAMESPACE - Súgó alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'help', 'notFound', 'Nem található súgó'),
('hu', 'help', 'generalContent', 'Általános súgó alkalmazás tartalom.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'help', 'notFound', 'Help not found'),
('en', 'help', 'generalContent', 'General help application content.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
