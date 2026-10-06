/** Kis, valódi tartalmú mintafájlok a típusfelismeréshez. */

export const PNG_1X1 = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64'
);

export const PDF_MINIMAL = Buffer.from(
	'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
	'latin1'
);

/** HTML tartalom .pdf kiterjesztéssel: a típus a tartalomból nem ismerhető fel. */
export const FAKE_PDF = Buffer.from('<html><script>alert(1)</script></html>', 'utf8');
