// lib/services/client/iconLoader.ts

/**
 * Ikon típusok.
 */
export const ICON_TYPES = {
	LUCIDE: 'lucide',
	PRIVATE_IMAGE: 'private_image',
	PRIVATE_SVG: 'private_svg',
	PUBLIC_IMAGE: 'public_image',
	PUBLIC_SVG: 'public_svg',
	EXTERNAL: 'external',
	DATA_URL: 'data_url'
} as const;

export type IconType = (typeof ICON_TYPES)[keyof typeof ICON_TYPES];

/**
 * Lucide ikon props típus.
 */
export interface LucideIconProps {
	size?: number | string;
	color?: string;
	strokeWidth?: number | string;
	class?: string;
	[key: string]: unknown;
}

/**
 * Ikon adat típus.
 * A content lehet:
 * - Lucide komponens (unknown típus, mert a lucide-svelte komponensek dinamikusan betöltöttek).
 * - string (SVG tartalom vagy URL).
 */
export interface IconData {
	type: IconType;
	content: unknown;
}

/**
 * Cache a betöltött ikonokhoz.
 */
const iconCache = new Map<string, IconData | null>();

/**
 * Ikon típus felismerése.
 * @param {string | null} iconName Ikon neve.
 * @returns {IconType | null} Ikon típus.
 */
export function detectIconType(iconName: string | null | undefined): IconType | null {
	if (!iconName) return null;

	// Data URL (base64 kódolt kép)
	if (iconName.startsWith('data:')) {
		return ICON_TYPES.DATA_URL;
	}

	// Külső URL (http/https)
	if (iconName.startsWith('http')) {
		if (iconName.endsWith('.svg')) return ICON_TYPES.EXTERNAL;
		return ICON_TYPES.EXTERNAL;
	}

	// Publikus fájlok (/) kezdetűek
	if (iconName.startsWith('/')) {
		if (iconName.endsWith('.svg')) return ICON_TYPES.PUBLIC_SVG;
		if (iconName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return ICON_TYPES.PUBLIC_IMAGE;
		return ICON_TYPES.PUBLIC_IMAGE;
	}

	// Privát fájlok (lib-ből) - előtag nélkül, de tartalmaz pont-ot
	if (iconName.includes('.')) {
		if (iconName.endsWith('.svg')) return ICON_TYPES.PRIVATE_SVG;
		if (iconName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return ICON_TYPES.PRIVATE_IMAGE;
		return ICON_TYPES.PRIVATE_IMAGE;
	}

	// Egyébként Lucide ikon
	return ICON_TYPES.LUCIDE;
}

/**
 * Lucide ikon betöltése.
 * Lucide ikonok neve PascalCase formátumban (pl. 'LayoutDashboard').
 * @param {string} iconName - Lucide ikon neve.
 * @returns {Promise<unknown>} Lucide ikon komponens.
 */
async function loadLucideIcon(iconName: string): Promise<unknown> {
	try {
		// Lucide-svelte dinamikus import
		const module = await import('lucide-svelte');
		const IconComponent = module[iconName as keyof typeof module];

		if (!IconComponent) {
			console.warn(`Lucide ikon '${iconName}' nem található a lucide-svelte csomagban`);
			return null;
		}

		// Lucide komponensek dinamikusan betöltöttek, unknown típusként adjuk vissza
		// A Svelte template-ben használva automatikusan felismeri a komponenst
		return IconComponent;
	} catch (error) {
		console.warn(`Lucide ikon '${iconName}' betöltési hiba:`, error);
		return null;
	}
}

/**
 * Privát SVG betöltése fetch-el.
 * @param {string} iconName - Pl. 'facebook.svg' vagy 'icon.svg'.
 * @param {string | undefined} appName - App/plugin neve.
 * @returns {Promise<string|null>} SVG tartalom.
 */
async function loadPrivateSvg(iconName: string, appName?: string) {
	try {
		let path = '/src/lib/assets/icons/';

		// Ha appName van megadva, először próbáljuk plugin asset-ként betölteni
		if (appName && appName !== '') {
			// Először próbáljuk plugin asset API-n keresztül
			const pluginAssetPath = `/api/plugins/${appName}/assets/${iconName}`;
			try {
				const pluginResponse = await fetch(pluginAssetPath);
				if (pluginResponse.ok) {
					return await pluginResponse.text();
				}
			} catch (pluginError) {
				console.log(
					`Plugin asset nem található: ${pluginAssetPath}, próbálkozás beépített app-ként`
				);
			}

			// Ha nem plugin asset, próbáljuk beépített app-ként
			path = `/src/lib/apps/${appName}/`;
		}

		const response = await fetch(`${path}${iconName}`);
		if (!response.ok) throw new Error(`SVG not found: ${path}${iconName}`);
		return await response.text();
	} catch (error) {
		console.warn(`Privát SVG '${iconName}' nem található:`, error);
		return null;
	}
}

/**
 * Privát kép betöltése URL-ként.
 * @param {string} iconName - Pl. 'facebook.png' vagy 'icon.png'.
 * @param {string | undefined} appName - App/plugin neve.
 * @returns {Promise<string|null>} Kép URL.
 */
async function loadPrivateImage(iconName: string, appName?: string) {
	console.log('private image:', iconName, appName);
	try {
		let path = '/src/lib/assets/icons/';

		// Ha appName van megadva, először próbáljuk plugin asset-ként betölteni
		if (appName && appName !== '') {
			// Először próbáljuk plugin asset API-n keresztül
			const pluginAssetPath = `/api/plugins/${appName}/assets/${iconName}`;
			try {
				const pluginResponse = await fetch(pluginAssetPath, { method: 'HEAD' });
				if (pluginResponse.ok) {
					return pluginAssetPath;
				}
			} catch (pluginError) {
				console.log(
					`Plugin asset nem található: ${pluginAssetPath}, próbálkozás beépített app-ként`
				);
			}

			// Ha nem plugin asset, próbáljuk beépített app-ként
			path = `/src/lib/apps/${appName}/`;
		}

		// Ellenőrizzük, hogy a kép elérhető-e
		const imageUrl = `${path}${iconName}`;
		const response = await fetch(imageUrl, { method: 'HEAD' });
		if (!response.ok) throw new Error(`Image not found: ${imageUrl}`);
		return imageUrl;
	} catch (error) {
		console.warn(`Privát kép '${iconName}' nem található:`, error);
		return null;
	}
}

/**
 * Publikus SVG betöltése fetch-el.
 * @param {string} svgPath - Pl. '/src/lib/assets/icons/facebook.svg'.
 * @returns {Promise<string|null>} SVG tartalom.
 */
async function loadPublicSvg(svgPath: string): Promise<string | null> {
	try {
		const response = await fetch(svgPath);
		if (!response.ok) throw new Error(`SVG not found: ${svgPath}`);
		return await response.text();
	} catch (error) {
		console.warn(`Publikus SVG '${svgPath}' nem található:`, error);
		return null;
	}
}

/**
 * Univerzális ikon betöltő.
 * @param {string | null | undefined} iconIdentifier - Ikon azonosító.
 * @param {string | undefined} appName - Alapértelmezett érték: undefined.
 * @returns {Promise<IconData | null>} Ikon adatok.
 */
export async function loadIcon(
	iconIdentifier: string | null | undefined,
	appName?: string
): Promise<IconData | null> {
	if (!iconIdentifier) return null;

	//console.log(iconIdentifier, ' appname:', appName);

	// Cache kulcs generálása - appName-mel együtt a privát ikonokhoz
	const iconType = detectIconType(iconIdentifier);
	const cacheKey =
		iconType === ICON_TYPES.PRIVATE_SVG || iconType === ICON_TYPES.PRIVATE_IMAGE
			? `${appName || ''}:${iconIdentifier}`
			: iconIdentifier;

	// Cache ellenőrzése
	if (iconCache.has(cacheKey)) {
		return iconCache.get(cacheKey) ?? null;
	}

	if (!iconType) {
		iconCache.set(cacheKey, null);
		return null;
	}

	let result: IconData | null = null;

	switch (iconType) {
		case ICON_TYPES.LUCIDE: {
			const lucideComponent = await loadLucideIcon(iconIdentifier);
			if (lucideComponent) {
				result = {
					type: ICON_TYPES.LUCIDE,
					content: lucideComponent
				};
			}
			break;
		}

		case ICON_TYPES.PRIVATE_SVG: {
			const privateSvgContent = await loadPrivateSvg(iconIdentifier, appName);
			if (privateSvgContent) {
				result = {
					type: ICON_TYPES.PRIVATE_SVG,
					content: privateSvgContent
				};
			}
			break;
		}

		case ICON_TYPES.PRIVATE_IMAGE: {
			const privateImageUrl = await loadPrivateImage(iconIdentifier, appName);
			if (privateImageUrl) {
				result = {
					type: ICON_TYPES.PRIVATE_IMAGE,
					content: privateImageUrl
				};
			}
			break;
		}
		case ICON_TYPES.PUBLIC_SVG: {
			const publicSvgContent = await loadPublicSvg(iconIdentifier);
			if (publicSvgContent) {
				result = {
					type: ICON_TYPES.PUBLIC_SVG,
					content: publicSvgContent
				};
			}
			break;
		}

		case ICON_TYPES.PUBLIC_IMAGE:
		case ICON_TYPES.EXTERNAL:
		case ICON_TYPES.DATA_URL:
			// Publikus képek, külső URL-ek és data URL-ek esetén csak az URL-t tároljuk
			result = {
				type: iconType,
				content: iconIdentifier
			};
			break;
	}

	// Cache-elés
	iconCache.set(cacheKey, result);
	return result;
}

/**
 * Cache tisztítása.
 */
export function clearIconCache(): void {
	iconCache.clear();
}
