/**
 * AvatarRenderer — csere-pont interfész az AI asszisztens 3D avatarjához.
 *
 * Bármely Svelte komponens, amely ezt az interfészt implementálja (azaz fogadja
 * az `emotionState` és `theme` prop-okat), behelyettesíthető a `RaccoonHead`
 * alapértelmezett implementáció helyett az `AiAvatarCanvas`-ban.
 *
 * Csere példa:
 * ```svelte
 * <!-- AiAvatarCanvas.svelte -->
 * <script>
 *   import CustomAvatar from './CustomAvatar.svelte';
 *   let { avatarComponent = CustomAvatar, emotionState, theme } = $props();
 * </script>
 * <svelte:component this={avatarComponent} {emotionState} {theme} />
 * ```
 *
 * Requirements: 13.1, 13.9
 */

import type { EmotionState } from '../types/index.js';

/**
 * Az avatar komponens által elvárt prop-ok.
 * Minden avatar implementációnak fogadnia kell ezeket a prop-okat.
 */
export interface AvatarRendererProps {
	/** Az aktuális érzelmi állapot, amely meghatározza az animációt */
	emotionState: EmotionState;
	/** Az aktuális téma — a világítás és színek ehhez igazodnak */
	theme: 'light' | 'dark';
	/** Opcionális: egérkövetés be/ki kapcsolása (alapértelmezett: true) */
	enableMouseTracking?: boolean;
	/** Opcionális: a panel referencia az egérkövetéshez */
	panelRef?: HTMLDivElement;
	/** Opcionális: fej animáció mód (alapértelmezett: 'idle') */
	headAnimationMode?: 'idle' | 'idle2' | 'typing' | 'breathing';
}

/**
 * Az AvatarRenderer interfész — TypeScript típusszintű kontraktus.
 *
 * Egy Svelte komponens akkor felel meg ennek az interfésznek, ha:
 * 1. Fogadja az `emotionState: EmotionState` prop-ot
 * 2. Fogadja a `theme: 'light' | 'dark'` prop-ot
 * 3. Vizuálisan reagál az `emotionState` változásaira (animáció)
 * 4. Alkalmazkodik a `theme` értékéhez (világítás, színek)
 *
 * @example
 * ```typescript
 * // Egyedi avatar komponens regisztrálása
 * import type { AvatarRendererProps } from './AvatarRenderer';
 * // A komponens props típusa legyen kompatibilis AvatarRendererProps-szal
 * let { emotionState, theme }: AvatarRendererProps = $props();
 * ```
 */
export interface AvatarRenderer extends AvatarRendererProps {}
