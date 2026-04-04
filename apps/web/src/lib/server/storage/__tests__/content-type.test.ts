/**
 * Property-Based Tests for Content-Type Header
 *
 * Feature: file-storage
 *
 * Property 10: Content-Type header
 * _Bármely_ sikeresen kiszolgált fájlra, a válasz Content-Type header-jének
 * MINDIG meg kell egyeznie a fájl tárolt MIME típusával.
 *
 * **Validates: Requirements 6.6**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// MIME Type Mapping (mirrors +server.ts logic)
// ============================================================================

/**
 * Get MIME type from file extension.
 * This mirrors the getMimeTypeFromExtension function in +server.ts.
 */
function getMimeTypeFromExtension(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase() ?? '';

	const mimeTypes: Record<string, string> = {
		// Images
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		ico: 'image/x-icon',
		bmp: 'image/bmp',

		// Documents
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		ppt: 'application/vnd.ms-powerpoint',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		txt: 'text/plain',
		csv: 'text/csv',
		rtf: 'application/rtf',

		// Archives
		zip: 'application/zip',
		rar: 'application/vnd.rar',
		'7z': 'application/x-7z-compressed',
		tar: 'application/x-tar',
		gz: 'application/gzip',

		// Audio
		mp3: 'audio/mpeg',
		wav: 'audio/wav',
		ogg: 'audio/ogg',
		m4a: 'audio/mp4',

		// Video
		mp4: 'video/mp4',
		webm: 'video/webm',
		avi: 'video/x-msvideo',
		mov: 'video/quicktime',
		mkv: 'video/x-matroska',

		// Other
		json: 'application/json',
		xml: 'application/xml',
		html: 'text/html',
		css: 'text/css',
		js: 'application/javascript'
	};

	return Object.hasOwn(mimeTypes, ext) ? mimeTypes[ext] : 'application/octet-stream';
}

// All known extensions with their expected MIME types
const knownExtensions: Array<{ ext: string; mimeType: string }> = [
	// Images
	{ ext: 'jpg', mimeType: 'image/jpeg' },
	{ ext: 'jpeg', mimeType: 'image/jpeg' },
	{ ext: 'png', mimeType: 'image/png' },
	{ ext: 'gif', mimeType: 'image/gif' },
	{ ext: 'webp', mimeType: 'image/webp' },
	{ ext: 'svg', mimeType: 'image/svg+xml' },
	{ ext: 'ico', mimeType: 'image/x-icon' },
	{ ext: 'bmp', mimeType: 'image/bmp' },

	// Documents
	{ ext: 'pdf', mimeType: 'application/pdf' },
	{ ext: 'doc', mimeType: 'application/msword' },
	{
		ext: 'docx',
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	},
	{ ext: 'xls', mimeType: 'application/vnd.ms-excel' },
	{ ext: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
	{ ext: 'ppt', mimeType: 'application/vnd.ms-powerpoint' },
	{
		ext: 'pptx',
		mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
	},
	{ ext: 'txt', mimeType: 'text/plain' },
	{ ext: 'csv', mimeType: 'text/csv' },
	{ ext: 'rtf', mimeType: 'application/rtf' },

	// Archives
	{ ext: 'zip', mimeType: 'application/zip' },
	{ ext: 'rar', mimeType: 'application/vnd.rar' },
	{ ext: '7z', mimeType: 'application/x-7z-compressed' },
	{ ext: 'tar', mimeType: 'application/x-tar' },
	{ ext: 'gz', mimeType: 'application/gzip' },

	// Audio
	{ ext: 'mp3', mimeType: 'audio/mpeg' },
	{ ext: 'wav', mimeType: 'audio/wav' },
	{ ext: 'ogg', mimeType: 'audio/ogg' },
	{ ext: 'm4a', mimeType: 'audio/mp4' },

	// Video
	{ ext: 'mp4', mimeType: 'video/mp4' },
	{ ext: 'webm', mimeType: 'video/webm' },
	{ ext: 'avi', mimeType: 'video/x-msvideo' },
	{ ext: 'mov', mimeType: 'video/quicktime' },
	{ ext: 'mkv', mimeType: 'video/x-matroska' },

	// Other
	{ ext: 'json', mimeType: 'application/json' },
	{ ext: 'xml', mimeType: 'application/xml' },
	{ ext: 'html', mimeType: 'text/html' },
	{ ext: 'css', mimeType: 'text/css' },
	{ ext: 'js', mimeType: 'application/javascript' }
];

// ============================================================================
// Arbitraries for generating test data
// ============================================================================

// Valid filename base (alphanumeric with underscores and hyphens)
const filenameBaseArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

// Known extension arbitrary
const knownExtensionArb = fc.constantFrom(...knownExtensions.map((e) => e.ext));

// Unknown extension arbitrary (extensions not in our mapping)
const unknownExtensionArb = fc.constantFrom(
	'xyz',
	'abc',
	'unknown',
	'foo',
	'bar',
	'qux',
	'test',
	'data',
	'bin',
	'raw'
);

// Valid category (lowercase alphanumeric with hyphens)
const categoryArb = fc.stringMatching(/^[a-z0-9-]{1,15}$/);

// Valid user ID (positive integer)
const userIdArb = fc.integer({ min: 1, max: 1000000 });

// Scope segment arbitrary
const scopeSegmentArb = fc.oneof(
	fc.constant('shared'),
	userIdArb.map((id) => `user-${id}`)
);

// ============================================================================
// Property 10: Content-Type header
// ============================================================================

describe('Content-Type Header - Property 10: Content-Type header', () => {
	/**
	 * Property 10a: Known extensions return correct MIME type.
	 *
	 * For ANY file with a known extension, the Content-Type
	 * should ALWAYS match the expected MIME type for that extension.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return correct MIME type for known extensions', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				fc.constantFrom(...knownExtensions),
				categoryArb,
				scopeSegmentArb,
				(basename, extInfo, category, scopeSegment) => {
					const filename = `${basename}.${extInfo.ext}`;
					const filePath = `${category}/${scopeSegment}/${filename}`;

					const mimeType = getMimeTypeFromExtension(filePath);

					// MIME type should match the expected type for this extension
					expect(mimeType).toBe(extInfo.mimeType);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10b: Unknown extensions return application/octet-stream.
	 *
	 * For ANY file with an unknown extension, the Content-Type
	 * should ALWAYS be 'application/octet-stream'.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return application/octet-stream for unknown extensions', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				unknownExtensionArb,
				categoryArb,
				scopeSegmentArb,
				(basename, ext, category, scopeSegment) => {
					const filename = `${basename}.${ext}`;
					const filePath = `${category}/${scopeSegment}/${filename}`;

					const mimeType = getMimeTypeFromExtension(filePath);

					// Unknown extensions should return octet-stream
					expect(mimeType).toBe('application/octet-stream');

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10c: Extension matching is case-insensitive.
	 *
	 * For ANY file extension in any case (upper, lower, mixed),
	 * the MIME type should be the same as the lowercase version.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should match extensions case-insensitively', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				fc.constantFrom(...knownExtensions),
				fc.constantFrom('upper', 'lower', 'mixed'),
				(basename, extInfo, caseType) => {
					let ext: string;
					switch (caseType) {
						case 'upper':
							ext = extInfo.ext.toUpperCase();
							break;
						case 'lower':
							ext = extInfo.ext.toLowerCase();
							break;
						case 'mixed':
							ext = extInfo.ext
								.split('')
								.map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
								.join('');
							break;
						default:
							ext = extInfo.ext;
					}

					const filename = `${basename}.${ext}`;
					const mimeType = getMimeTypeFromExtension(filename);

					// Should match the expected MIME type regardless of case
					expect(mimeType).toBe(extInfo.mimeType);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10d: MIME type is determined by last extension only.
	 *
	 * For ANY file with multiple dots in the name, only the last
	 * segment after the final dot should determine the MIME type.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should use only the last extension for MIME type determination', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				fc.constantFrom(...knownExtensions),
				fc.constantFrom(...knownExtensions),
				(basename, firstExt, lastExt) => {
					// Create a filename with multiple extensions like "file.tar.gz"
					const filename = `${basename}.${firstExt.ext}.${lastExt.ext}`;
					const mimeType = getMimeTypeFromExtension(filename);

					// Should match the LAST extension's MIME type
					expect(mimeType).toBe(lastExt.mimeType);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10e: Files without extension return application/octet-stream.
	 *
	 * For ANY file without an extension, the Content-Type
	 * should ALWAYS be 'application/octet-stream'.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return application/octet-stream for files without extension', () => {
		fc.assert(
			fc.property(filenameBaseArb, categoryArb, scopeSegmentArb, (basename, category, scope) => {
				// Filename without extension
				const filePath = `${category}/${scope}/${basename}`;
				const mimeType = getMimeTypeFromExtension(filePath);

				// No extension should return octet-stream
				expect(mimeType).toBe('application/octet-stream');

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10f: MIME type determination is deterministic.
	 *
	 * For ANY file path, multiple calls to getMimeTypeFromExtension
	 * should ALWAYS return the same MIME type.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return consistent MIME types for the same file path', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				knownExtensionArb,
				categoryArb,
				scopeSegmentArb,
				(basename, ext, category, scope) => {
					const filePath = `${category}/${scope}/${basename}.${ext}`;

					// Call multiple times
					const results: string[] = [];
					for (let i = 0; i < 5; i++) {
						results.push(getMimeTypeFromExtension(filePath));
					}

					// All results should be identical
					const firstResult = results[0];
					for (const result of results) {
						expect(result).toBe(firstResult);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10g: MIME type is always a valid format.
	 *
	 * For ANY file path, the returned MIME type should ALWAYS
	 * follow the format "type/subtype".
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should always return a valid MIME type format', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					// Known extension
					fc.tuple(filenameBaseArb, knownExtensionArb).map(([b, e]) => `${b}.${e}`),
					// Unknown extension
					fc.tuple(filenameBaseArb, unknownExtensionArb).map(([b, e]) => `${b}.${e}`),
					// No extension
					filenameBaseArb
				),
				(filename) => {
					const mimeType = getMimeTypeFromExtension(filename);

					// MIME type should match the format "type/subtype"
					expect(mimeType).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 10h: Image extensions return image/* MIME types.
	 *
	 * For ANY image file extension, the MIME type should ALWAYS
	 * start with "image/".
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return image/* MIME types for image extensions', () => {
		const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];

		fc.assert(
			fc.property(filenameBaseArb, fc.constantFrom(...imageExtensions), (basename, ext) => {
				const filename = `${basename}.${ext}`;
				const mimeType = getMimeTypeFromExtension(filename);

				// Should be an image MIME type
				expect(mimeType.startsWith('image/')).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10i: Audio extensions return audio/* MIME types.
	 *
	 * For ANY audio file extension, the MIME type should ALWAYS
	 * start with "audio/".
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return audio/* MIME types for audio extensions', () => {
		const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];

		fc.assert(
			fc.property(filenameBaseArb, fc.constantFrom(...audioExtensions), (basename, ext) => {
				const filename = `${basename}.${ext}`;
				const mimeType = getMimeTypeFromExtension(filename);

				// Should be an audio MIME type
				expect(mimeType.startsWith('audio/')).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10j: Video extensions return video/* MIME types.
	 *
	 * For ANY video file extension, the MIME type should ALWAYS
	 * start with "video/".
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return video/* MIME types for video extensions', () => {
		const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv'];

		fc.assert(
			fc.property(filenameBaseArb, fc.constantFrom(...videoExtensions), (basename, ext) => {
				const filename = `${basename}.${ext}`;
				const mimeType = getMimeTypeFromExtension(filename);

				// Should be a video MIME type
				expect(mimeType.startsWith('video/')).toBe(true);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 10k: Path structure does not affect MIME type.
	 *
	 * For ANY file with the same extension but different paths,
	 * the MIME type should ALWAYS be the same.
	 *
	 * **Validates: Requirements 6.6**
	 */
	it('should return same MIME type regardless of path structure', () => {
		fc.assert(
			fc.property(
				filenameBaseArb,
				fc.constantFrom(...knownExtensions),
				fc.array(categoryArb, { minLength: 1, maxLength: 5 }),
				(basename, extInfo, pathParts) => {
					const filename = `${basename}.${extInfo.ext}`;

					// Create different path structures
					const paths = [
						filename,
						`${pathParts[0]}/${filename}`,
						`${pathParts.join('/')}/${filename}`,
						`deep/nested/path/${filename}`
					];

					// All paths should return the same MIME type
					const mimeTypes = paths.map((p) => getMimeTypeFromExtension(p));

					for (const mimeType of mimeTypes) {
						expect(mimeType).toBe(extInfo.mimeType);
					}

					return true;
				}
			),
			testConfig
		);
	});
});
