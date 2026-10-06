/**
 * @packageDocumentation
 * Eszköztípus felismerése a böngésző azonosítójából (User-Agent).
 *
 * A munkamenet-szabály (eszköztípusonként egy munkamenet) és a nézetválasztás
 * (asztali vagy mobil keret) is ezt használja.
 */

export type DeviceType = 'desktop' | 'mobile';

/**
 * Telefonok mintája. A `Mobi` a böngészők ajánlott jelölése mobilra (Chrome,
 * Firefox, Safari), az `Android`, `iPhone` és `iPod` a régebbi és a beágyazott
 * böngészők miatt kell.
 */
const MOBILE_PATTERN = /Mobi|Android|iPhone|iPod/i;

/** Android táblagépek: az azonosítójukban nincs `Mobile` jelölés */
const ANDROID_TABLET_PATTERN = /Android(?!.*Mobile)/i;

/**
 * Eszköztípus a User-Agent alapján.
 *
 * Csak a telefon számít mobilnak. A táblagépek asztali nézetet kapnak
 * (az iPad amúgy is Mac-nek mutatja magát). Hiányzó azonosító esetén asztali.
 */
export function classifyDevice(userAgent: string | null | undefined): DeviceType {
	if (!userAgent) return 'desktop';
	if (ANDROID_TABLET_PATTERN.test(userAgent)) return 'desktop';
	return MOBILE_PATTERN.test(userAgent) ? 'mobile' : 'desktop';
}
