-- =============================================================================
-- CHAT NAMESPACE - Chat alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'userList.title', 'Felhasználók'),
('hu', 'chat', 'userList.loading', 'Betöltés...'),
('hu', 'chat', 'userList.noResults', 'Nincs találat'),
('hu', 'chat', 'userList.online', 'Online ({count})'),
('hu', 'chat', 'userList.offline', 'Offline ({count})')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'conversationList.title', 'Beszélgetések'),
('hu', 'chat', 'conversationList.empty', 'Még nincs beszélgetésed'),
('hu', 'chat', 'conversationList.hint', 'Válassz egy felhasználót a jobb oldalon')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'chatWindow.selectConversation', 'Válassz egy beszélgetést'),
('hu', 'chat', 'chatWindow.noMessages', 'Még nincs üzenet ebben a beszélgetésben')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'userList.title', 'Users'),
('en', 'chat', 'userList.loading', 'Loading...'),
('en', 'chat', 'userList.noResults', 'No results'),
('en', 'chat', 'userList.online', 'Online ({count})'),
('en', 'chat', 'userList.offline', 'Offline ({count})')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'conversationList.title', 'Conversations'),
('en', 'chat', 'conversationList.empty', 'No conversations yet'),
('en', 'chat', 'conversationList.hint', 'Select a user on the right')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'chatWindow.selectConversation', 'Select a conversation'),
('en', 'chat', 'chatWindow.noMessages', 'No messages in this conversation yet')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
