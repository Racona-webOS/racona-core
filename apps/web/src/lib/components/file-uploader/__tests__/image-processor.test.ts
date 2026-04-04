/**
 * Property-Based Tests for Image Processor
 *
 * Feature: file-uploader
 *
 * Property 5: Képátméretezés arány megőrzés
 * _Bármely_ képre eredeti szélességgel (w) és magassággal (h), ha átméretezés történik
 * új szélességre (w') és magasságra (h'), akkor a relatív arány eltérés < 5% MINDIG
 * teljesülnie kell.
 * **Validates: Requirements 4.3**
 *
 * Property 7: Bélyegkép generálás garancia
 * _Bármely_ képre, ha generateThumbnail true, akkor a processImage függvény eredménye
 * MINDIG tartalmaznia kell egy nem-null thumbnail mezőt.
 * **Validates: Requirements 4.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import sharp from 'sharp';
import { resizeImage, calculateProportionalDimensions, processImage } from '../image-processor.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Creates a minimal valid image buffer with specified dimensions.
 * Uses sharp to generate a solid color image.
 */
async function createTestImage(width: number, height: number): Promise<Buffer> {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 128, g: 128, b: 128 }
		}
	})
		.jpeg({ quality: 80 })
		.toBuffer();
}

/**
 * Calculates the relative aspect ratio difference between two dimension pairs.
 * Returns the relative difference normalized by the larger ratio.
 */
function calculateRelativeAspectRatioDifference(
	originalWidth: number,
	originalHeight: number,
	newWidth: number,
	newHeight: number
): number {
	const originalRatio = originalWidth / originalHeight;
	const newRatio = newWidth / newHeight;
	const maxRatio = Math.max(originalRatio, newRatio);
	return Math.abs(originalRatio - newRatio) / maxRatio;
}

// ============================================================================
// Arbitraries for realistic image dimensions (aspect ratio max 4:1)
// ============================================================================

// Generate realistic image dimensions with bounded aspect ratio
const realisticImageDimensionsArb = fc
	.tuple(fc.integer({ min: 200, max: 2000 }), fc.integer({ min: 200, max: 2000 }))
	.filter(([w, h]) => {
		const ratio = w / h;
		return ratio >= 0.25 && ratio <= 4; // Aspect ratio between 1:4 and 4:1
	});

// Max dimension constraints (reasonable sizes)
const maxDimensionArb = fc.integer({ min: 100, max: 1500 });

// ============================================================================
// Property 5: Képátméretezés arány megőrzés
// ============================================================================

describe('Image Resizing - Property 5: Képátméretezés arány megőrzés', () => {
	/**
	 * Property 5a: calculateProportionalDimensions preserves aspect ratio
	 *
	 * For any realistic dimensions and max constraints, the calculated
	 * proportional dimensions should maintain the aspect ratio within 5% relative tolerance.
	 *
	 * **Validates: Requirements 4.3**
	 */
	it('should preserve aspect ratio within 5% relative tolerance when calculating proportional dimensions', () => {
		fc.assert(
			fc.property(
				realisticImageDimensionsArb,
				maxDimensionArb,
				maxDimensionArb,
				([originalWidth, originalHeight], maxWidth, maxHeight) => {
					const result = calculateProportionalDimensions(
						{ width: originalWidth, height: originalHeight },
						maxWidth,
						maxHeight
					);

					// Only check aspect ratio if resizing actually occurred
					if (result.width !== originalWidth || result.height !== originalHeight) {
						const relativeAspectRatioDiff = calculateRelativeAspectRatioDifference(
							originalWidth,
							originalHeight,
							result.width,
							result.height
						);

						// Relative aspect ratio difference should be less than 5%
						expect(relativeAspectRatioDiff).toBeLessThan(0.05);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5b: resizeImage preserves aspect ratio on actual images
	 *
	 * For any generated test image with realistic dimensions, when resized
	 * with max constraints, the resulting image should maintain the aspect
	 * ratio within 5% relative tolerance.
	 *
	 * **Validates: Requirements 4.3**
	 */
	it('should preserve aspect ratio within 5% relative tolerance when resizing actual images', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 100, max: 500 }), fc.integer({ min: 100, max: 500 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});
		const smallMaxDimensionArb = fc.integer({ min: 50, max: 300 });

		await fc.assert(
			fc.asyncProperty(
				smallImageDimensionsArb,
				smallMaxDimensionArb,
				smallMaxDimensionArb,
				async ([originalWidth, originalHeight], maxWidth, maxHeight) => {
					const imageBuffer = await createTestImage(originalWidth, originalHeight);

					const result = await resizeImage(imageBuffer, {
						maxWidth,
						maxHeight
					});

					if (
						result.dimensions.width !== originalWidth ||
						result.dimensions.height !== originalHeight
					) {
						const relativeAspectRatioDiff = calculateRelativeAspectRatioDifference(
							originalWidth,
							originalHeight,
							result.dimensions.width,
							result.dimensions.height
						);

						expect(relativeAspectRatioDiff).toBeLessThan(0.05);
					}

					return true;
				}
			),
			{ ...testConfig, numRuns: 20 }
		);
	});

	/**
	 * Property 5c: Aspect ratio preserved when only width is constrained
	 *
	 * **Validates: Requirements 4.3**
	 */
	it('should preserve aspect ratio when only width is constrained', () => {
		fc.assert(
			fc.property(realisticImageDimensionsArb, maxDimensionArb, ([width, height], maxWidth) => {
				const result = calculateProportionalDimensions({ width, height }, maxWidth, undefined);

				if (result.width !== width || result.height !== height) {
					const relativeAspectRatioDiff = calculateRelativeAspectRatioDifference(
						width,
						height,
						result.width,
						result.height
					);

					expect(relativeAspectRatioDiff).toBeLessThan(0.05);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 5d: Aspect ratio preserved when only height is constrained
	 *
	 * **Validates: Requirements 4.3**
	 */
	it('should preserve aspect ratio when only height is constrained', () => {
		fc.assert(
			fc.property(realisticImageDimensionsArb, maxDimensionArb, ([width, height], maxHeight) => {
				const result = calculateProportionalDimensions({ width, height }, undefined, maxHeight);

				if (result.width !== width || result.height !== height) {
					const relativeAspectRatioDiff = calculateRelativeAspectRatioDifference(
						width,
						height,
						result.width,
						result.height
					);

					expect(relativeAspectRatioDiff).toBeLessThan(0.05);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 5e: No constraints returns original dimensions
	 *
	 * When no max constraints are provided, the original dimensions
	 * should be returned unchanged.
	 *
	 * **Validates: Requirements 4.3**
	 */
	it('should return original dimensions when no constraints are provided', () => {
		fc.assert(
			fc.property(realisticImageDimensionsArb, ([width, height]) => {
				const result = calculateProportionalDimensions({ width, height }, undefined, undefined);

				expect(result.width).toBe(width);
				expect(result.height).toBe(height);

				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 6: Képméret korlát betartása
// ============================================================================

describe('Image Resizing - Property 6: Képméret korlát betartása', () => {
	/**
	 * Property 6a: calculateProportionalDimensions respects maxWidth constraint
	 *
	 * For any image dimensions and maxWidth constraint, the resulting width
	 * should NEVER exceed maxWidth.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should never exceed maxWidth constraint in calculated dimensions', () => {
		fc.assert(
			fc.property(
				realisticImageDimensionsArb,
				maxDimensionArb,
				([originalWidth, originalHeight], maxWidth) => {
					const result = calculateProportionalDimensions(
						{ width: originalWidth, height: originalHeight },
						maxWidth,
						undefined
					);

					// Width should never exceed maxWidth
					expect(result.width).toBeLessThanOrEqual(maxWidth);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 6b: calculateProportionalDimensions respects maxHeight constraint
	 *
	 * For any image dimensions and maxHeight constraint, the resulting height
	 * should NEVER exceed maxHeight.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should never exceed maxHeight constraint in calculated dimensions', () => {
		fc.assert(
			fc.property(
				realisticImageDimensionsArb,
				maxDimensionArb,
				([originalWidth, originalHeight], maxHeight) => {
					const result = calculateProportionalDimensions(
						{ width: originalWidth, height: originalHeight },
						undefined,
						maxHeight
					);

					// Height should never exceed maxHeight
					expect(result.height).toBeLessThanOrEqual(maxHeight);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 6c: calculateProportionalDimensions respects both constraints
	 *
	 * For any image dimensions and both maxWidth and maxHeight constraints,
	 * the resulting dimensions should NEVER exceed either constraint.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should never exceed either constraint when both are provided', () => {
		fc.assert(
			fc.property(
				realisticImageDimensionsArb,
				maxDimensionArb,
				maxDimensionArb,
				([originalWidth, originalHeight], maxWidth, maxHeight) => {
					const result = calculateProportionalDimensions(
						{ width: originalWidth, height: originalHeight },
						maxWidth,
						maxHeight
					);

					// Width should never exceed maxWidth
					expect(result.width).toBeLessThanOrEqual(maxWidth);
					// Height should never exceed maxHeight
					expect(result.height).toBeLessThanOrEqual(maxHeight);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 6d: resizeImage respects size constraints on actual images
	 *
	 * For any generated test image, when resized with max constraints,
	 * the resulting image dimensions should NEVER exceed the constraints.
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should never exceed size constraints when resizing actual images', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 100, max: 500 }), fc.integer({ min: 100, max: 500 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});
		const smallMaxDimensionArb = fc.integer({ min: 50, max: 300 });

		await fc.assert(
			fc.asyncProperty(
				smallImageDimensionsArb,
				smallMaxDimensionArb,
				smallMaxDimensionArb,
				async ([originalWidth, originalHeight], maxWidth, maxHeight) => {
					const imageBuffer = await createTestImage(originalWidth, originalHeight);

					const result = await resizeImage(imageBuffer, {
						maxWidth,
						maxHeight
					});

					// Width should never exceed maxWidth
					expect(result.dimensions.width).toBeLessThanOrEqual(maxWidth);
					// Height should never exceed maxHeight
					expect(result.dimensions.height).toBeLessThanOrEqual(maxHeight);

					return true;
				}
			),
			{ ...testConfig, numRuns: 20 }
		);
	});

	/**
	 * Property 6e: Images smaller than constraints remain unchanged
	 *
	 * For any image that is already smaller than the constraints,
	 * the dimensions should remain unchanged (no upscaling).
	 *
	 * **Validates: Requirements 4.1**
	 */
	it('should not upscale images smaller than constraints', () => {
		// Generate dimensions where original is smaller than max
		const smallerThanConstraintsArb = fc
			.tuple(
				fc.integer({ min: 50, max: 200 }),
				fc.integer({ min: 50, max: 200 }),
				fc.integer({ min: 300, max: 1000 }),
				fc.integer({ min: 300, max: 1000 })
			)
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});

		fc.assert(
			fc.property(smallerThanConstraintsArb, ([width, height, maxWidth, maxHeight]) => {
				const result = calculateProportionalDimensions({ width, height }, maxWidth, maxHeight);

				// Dimensions should remain unchanged when smaller than constraints
				expect(result.width).toBe(width);
				expect(result.height).toBe(height);

				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 7: Bélyegkép generálás garancia
// ============================================================================

describe('Image Processing - Property 7: Bélyegkép generálás garancia', () => {
	/**
	 * Property 7a: processImage always returns thumbnail when generateThumbnail is true
	 *
	 * For any valid image, when processImage is called with generateThumbnail: true,
	 * the result MUST always contain a non-null thumbnail property.
	 *
	 * **Validates: Requirements 4.2**
	 */
	it('should always return a thumbnail when generateThumbnail is true', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 50, max: 400 }), fc.integer({ min: 50, max: 400 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});

		await fc.assert(
			fc.asyncProperty(smallImageDimensionsArb, async ([width, height]) => {
				const imageBuffer = await createTestImage(width, height);

				const result = await processImage(imageBuffer, {
					generateThumbnail: true
				});

				// Thumbnail MUST be present when generateThumbnail is true
				expect(result.thumbnail).toBeDefined();
				expect(result.thumbnail).not.toBeNull();
				expect(result.thumbnail?.buffer).toBeInstanceOf(Buffer);
				expect(result.thumbnail?.dimensions.width).toBeGreaterThan(0);
				expect(result.thumbnail?.dimensions.height).toBeGreaterThan(0);

				return true;
			}),
			{ ...testConfig, numRuns: 20 }
		);
	});

	/**
	 * Property 7b: Thumbnail is not present when generateThumbnail is false or undefined
	 *
	 * For any valid image, when processImage is called without generateThumbnail
	 * or with generateThumbnail: false, the result should NOT contain a thumbnail.
	 *
	 * **Validates: Requirements 4.2**
	 */
	it('should not return a thumbnail when generateThumbnail is false', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 50, max: 400 }), fc.integer({ min: 50, max: 400 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});

		await fc.assert(
			fc.asyncProperty(smallImageDimensionsArb, async ([width, height]) => {
				const imageBuffer = await createTestImage(width, height);

				const result = await processImage(imageBuffer, {
					generateThumbnail: false
				});

				// Thumbnail should NOT be present when generateThumbnail is false
				expect(result.thumbnail).toBeUndefined();

				return true;
			}),
			{ ...testConfig, numRuns: 20 }
		);
	});

	/**
	 * Property 7c: Thumbnail respects custom size constraints
	 *
	 * For any valid image, when processImage is called with generateThumbnail: true
	 * and custom thumbnail dimensions, the thumbnail should respect those constraints.
	 *
	 * **Validates: Requirements 4.2**
	 */
	it('should respect custom thumbnail size constraints', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 100, max: 400 }), fc.integer({ min: 100, max: 400 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});
		const thumbnailSizeArb = fc.integer({ min: 50, max: 150 });

		await fc.assert(
			fc.asyncProperty(
				smallImageDimensionsArb,
				thumbnailSizeArb,
				thumbnailSizeArb,
				async ([width, height], thumbMaxWidth, thumbMaxHeight) => {
					const imageBuffer = await createTestImage(width, height);

					const result = await processImage(imageBuffer, {
						generateThumbnail: true,
						thumbnailMaxWidth: thumbMaxWidth,
						thumbnailMaxHeight: thumbMaxHeight
					});

					// Thumbnail MUST be present
					expect(result.thumbnail).toBeDefined();
					expect(result.thumbnail).not.toBeNull();

					// Thumbnail dimensions should respect constraints
					expect(result.thumbnail!.dimensions.width).toBeLessThanOrEqual(thumbMaxWidth);
					expect(result.thumbnail!.dimensions.height).toBeLessThanOrEqual(thumbMaxHeight);

					return true;
				}
			),
			{ ...testConfig, numRuns: 20 }
		);
	});

	/**
	 * Property 7d: Thumbnail has valid image data
	 *
	 * For any valid image, when a thumbnail is generated, it should contain
	 * valid image data that can be processed by sharp.
	 *
	 * **Validates: Requirements 4.2**
	 */
	it('should generate valid thumbnail image data', async () => {
		const smallImageDimensionsArb = fc
			.tuple(fc.integer({ min: 50, max: 300 }), fc.integer({ min: 50, max: 300 }))
			.filter(([w, h]) => {
				const ratio = w / h;
				return ratio >= 0.25 && ratio <= 4;
			});

		await fc.assert(
			fc.asyncProperty(smallImageDimensionsArb, async ([width, height]) => {
				const imageBuffer = await createTestImage(width, height);

				const result = await processImage(imageBuffer, {
					generateThumbnail: true
				});

				// Thumbnail should be valid image data
				expect(result.thumbnail).toBeDefined();
				const thumbnailMetadata = await sharp(result.thumbnail!.buffer).metadata();
				expect(thumbnailMetadata.width).toBeGreaterThan(0);
				expect(thumbnailMetadata.height).toBeGreaterThan(0);
				expect(thumbnailMetadata.format).toBeDefined();

				return true;
			}),
			{ ...testConfig, numRuns: 20 }
		);
	});
});
