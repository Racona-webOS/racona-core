-- __PLUGIN_ID__ plugin kezdeti séma
-- A táblaneveket a telepítő automatikusan prefixeli a plugin sémával (plugin___PLUGIN_ID_UNDERSCORE__)

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_created_at ON items (created_at);
