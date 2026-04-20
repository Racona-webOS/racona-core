/**
 * Közös típus definíciók központi exportja
 * Ez a fájl összegyűjti és exportálja az összes közös típust a könnyebb importálás érdekében
 */

// Asztali környezet típusok
export type { TaskbarPosition, BackgroundType } from './desktopEnviroment.js';

// Beállítások típusok
export type { BackgroundSettings, UserSettings, TTSSettings } from './settings.js';

export { DEFAULT_USER_SETTINGS } from './settings.js';

// Téma típusok
export type { ThemeMode, ThemeSettings } from './theme.js';

export { DEFAULT_THEME_SETTINGS } from './theme.js';

// Ablak és alkalmazás típusok
export type { WindowSize, AppMetadata, AppParameters } from './window.js';

// Menü típusok
export type { MenuItem, MenuItemClickEvent } from './menu.js';

// Közös segédprogram típusok (szerver és kliens oldalon is használható)
export type { LocalizedText } from '../utils/validation.js';

export { localizedTextSchema } from '../utils/validation.js';

// Ikon típusok
export type { IconType, LucideIconProps, IconData } from '../services/client/iconLoader.js';

export { ICON_TYPES } from '../services/client/iconLoader.js';
