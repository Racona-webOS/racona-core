/**
 * Képfeldolgozó szolgáltatás
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * A sharp csomagot használja a képfeldolgozáshoz.
 */

import sharp from 'sharp';
import { THUMBNAIL_CONFIG } from './types.js';

// ============================================================================
// Típusok
// ============================================================================

/** Kép dimenziók */
export interface ImageDimensions {
	width: number;
	height: number;
}

/** Átméretezési opciók */
export interface ResizeOptions {
	/** Maximum szélesség */
	maxWidth?: number;
	/** Maximum magasság */
	maxHeight?: number;
	/** Minőség (1-100) */
	quality?: number;
}

/** Képfeldolgozás eredménye */
export interface ImageProcessingResult {
	/** Feldolgozott kép buffer */
	buffer: Buffer;
	/** Eredmény dimenziók */
	dimensions: ImageDimensions;
	/** MIME típus */
	mimeType: string;
}

/** Teljes feldolgozás eredménye */
export interface ProcessImageResult {
	/** Feldolgozott (átméretezett) kép */
	processed: ImageProcessingResult;
	/** Bélyegkép (ha kérték) */
	thumbnail?: ImageProcessingResult;
	/** Eredeti dimenziók */
	originalDimensions: ImageDimensions;
}

// ============================================================================
// Segédfüggvények
// ============================================================================

/**
 * Kiszámítja az új dimenziókat az arány megőrzésével.
 *
 * @param original - Eredeti dimenziók
 * @param maxWidth - Maximum szélesség
 * @param maxHeight - Maximum magasság
 * @returns Az új dimenziók
 *
 * Requirements: 4.3 - Arány megőrzése átméretezéskor
 */
export function calculateProportionalDimensions(
	original: ImageDimensions,
	maxWidth?: number,
	maxHeight?: number
): ImageDimensions {
	let { width, height } = original;

	// Ha nincs korlátozás, visszaadjuk az eredetit
	if (!maxWidth && !maxHeight) {
		return { width, height };
	}

	const aspectRatio = width / height;

	// Szélesség korlátozás
	if (maxWidth && width > maxWidth) {
		width = maxWidth;
		height = Math.round(width / aspectRatio);
	}

	// Magasság korlátozás
	if (maxHeight && height > maxHeight) {
		height = maxHeight;
		width = Math.round(height * aspectRatio);
	}

	return { width, height };
}

// ============================================================================
// Képfeldolgozó függvények
// ============================================================================

/**
 * Átméretezi a képet a megadott korlátok szerint, megőrizve az arányt.
 *
 * @param buffer - A kép bináris tartalma
 * @param options - Átméretezési opciók
 * @returns A feldolgozott kép
 *
 * Requirements: 4.1 - Átméretezés ha meghaladja a korlátokat
 * Requirements: 4.3 - Arány megőrzése
 * Requirements: 4.4 - Dedikált képfeldolgozó könyvtár használata
 */
export async function resizeImage(
	buffer: Buffer | Uint8Array,
	options: ResizeOptions
): Promise<ImageProcessingResult> {
	const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
	const image = sharp(inputBuffer);

	// Eredeti metaadatok lekérése
	const metadata = await image.metadata();
	const originalWidth = metadata.width || 0;
	const originalHeight = metadata.height || 0;

	// Új dimenziók kiszámítása
	const newDimensions = calculateProportionalDimensions(
		{ width: originalWidth, height: originalHeight },
		options.maxWidth,
		options.maxHeight
	);

	// Átméretezés csak ha szükséges
	let processedImage = image;
	if (newDimensions.width !== originalWidth || newDimensions.height !== originalHeight) {
		// 'fill': pontosan a kiszámított méretet kapjuk — az 'inside' a sharp saját
		// lefelé kerekítésével 1px-lel kisebb oldalt adhatna (pl. 51×15 helyett 51×14)
		processedImage = image.resize(newDimensions.width, newDimensions.height, {
			fit: 'fill',
			withoutEnlargement: true
		});
	}

	// Minőség beállítása és buffer generálása
	const quality = options.quality || 80;
	const format = metadata.format || 'jpeg';

	let outputBuffer: Buffer;
	let mimeType: string;

	switch (format) {
		case 'png':
			outputBuffer = await processedImage.png({ quality }).toBuffer();
			mimeType = 'image/png';
			break;
		case 'webp':
			outputBuffer = await processedImage.webp({ quality }).toBuffer();
			mimeType = 'image/webp';
			break;
		case 'gif':
			outputBuffer = await processedImage.gif().toBuffer();
			mimeType = 'image/gif';
			break;
		default:
			outputBuffer = await processedImage.jpeg({ quality }).toBuffer();
			mimeType = 'image/jpeg';
	}

	// Végső dimenziók lekérése
	const outputMetadata = await sharp(outputBuffer).metadata();

	return {
		buffer: outputBuffer,
		dimensions: {
			width: outputMetadata.width || newDimensions.width,
			height: outputMetadata.height || newDimensions.height
		},
		mimeType
	};
}

/**
 * Generál egy bélyegképet a képből.
 *
 * @param buffer - A kép bináris tartalma
 * @param maxWidth - Maximum szélesség (alapértelmezett: 200)
 * @param maxHeight - Maximum magasság (alapértelmezett: 200)
 * @param quality - Minőség (alapértelmezett: 80)
 * @returns A bélyegkép
 *
 * Requirements: 4.2 - Bélyegkép generálás
 */
export async function generateThumbnail(
	buffer: Buffer | Uint8Array,
	maxWidth: number = THUMBNAIL_CONFIG.maxWidth,
	maxHeight: number = THUMBNAIL_CONFIG.maxHeight,
	quality: number = THUMBNAIL_CONFIG.quality
): Promise<ImageProcessingResult> {
	return resizeImage(buffer, {
		maxWidth,
		maxHeight,
		quality
	});
}

/**
 * Feldolgozza a képet: átméretezi és opcionálisan bélyegképet generál.
 *
 * @param buffer - A kép bináris tartalma
 * @param options - Feldolgozási opciók
 * @returns A feldolgozás eredménye
 *
 * Requirements: 4.5 - Eredeti és feldolgozott kép adatok visszaadása
 */
export async function processImage(
	buffer: Buffer | Uint8Array,
	options: {
		maxWidth?: number;
		maxHeight?: number;
		generateThumbnail?: boolean;
		thumbnailMaxWidth?: number;
		thumbnailMaxHeight?: number;
		quality?: number;
	}
): Promise<ProcessImageResult> {
	const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

	// Eredeti dimenziók lekérése
	const metadata = await sharp(inputBuffer).metadata();
	const originalDimensions: ImageDimensions = {
		width: metadata.width || 0,
		height: metadata.height || 0
	};

	// Fő kép átméretezése
	const processed = await resizeImage(inputBuffer, {
		maxWidth: options.maxWidth,
		maxHeight: options.maxHeight,
		quality: options.quality
	});

	const result: ProcessImageResult = {
		processed,
		originalDimensions
	};

	// Bélyegkép generálása ha kérték
	if (options.generateThumbnail) {
		result.thumbnail = await generateThumbnail(
			inputBuffer,
			options.thumbnailMaxWidth || THUMBNAIL_CONFIG.maxWidth,
			options.thumbnailMaxHeight || THUMBNAIL_CONFIG.maxHeight,
			options.quality || THUMBNAIL_CONFIG.quality
		);
	}

	return result;
}

/**
 * Lekéri a kép metaadatait.
 *
 * @param buffer - A kép bináris tartalma
 * @returns A kép dimenziói
 */
export async function getImageDimensions(buffer: Buffer | Uint8Array): Promise<ImageDimensions> {
	const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
	const metadata = await sharp(inputBuffer).metadata();

	return {
		width: metadata.width || 0,
		height: metadata.height || 0
	};
}
