/**
 * Remote függvény hibák szűrése a kliens felé.
 *
 * A pluginok szándékosan dobnak a felhasználónak szánt üzeneteket
 * (pl. "Nincs elég szabadságkeret") — ezeket változatlanul továbbadjuk,
 * a plugin UI ezekre épít.
 *
 * A váratlan hibák viszont belső részleteket szivárogtatnak a felületre:
 * az adatbázis hibák séma-, tábla-, oszlop- és constraint neveket
 * (pl. `column "employee_id" does not exist`), a JS futásidejű hibák pedig
 * a kód szerkezetét. Ezeket általános üzenetre cseréljük, és a teljes hiba
 * csak a szerver logba kerül, egy hivatkozási azonosítóval együtt.
 */

/** pg SQLSTATE, pl. 42703 (undefined_column) */
const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

/** Node rendszerhiba kód, pl. ECONNREFUSED, ERR_SOCKET_CLOSED */
const SYSTEM_ERROR_CODE_PATTERN = /^(E[A-Z0-9]+|ERR_[A-Z0-9_]+)$/;

/**
 * Beépített JS hibatípusok. Ezek mindig programhibát jeleznek, sosem a
 * pluginszerző által a felhasználónak szánt üzenetet.
 */
const RUNTIME_ERROR_NAMES = new Set([
	'TypeError',
	'RangeError',
	'ReferenceError',
	'SyntaxError',
	'EvalError',
	'URIError'
]);

/** A kliensnek küldött általános üzenet váratlan hiba esetén. */
export const GENERIC_REMOTE_ERROR_MESSAGE = 'The operation failed due to a server error';

/**
 * Belső (nem a felhasználónak szánt) hiba-e?
 *
 * Adatbázis hiba: a pg `DatabaseError` `severity` mezőt és SQLSTATE `code`-ot
 * hoz, a kapcsolati hibák Node rendszerhiba kódot.
 *
 * @param err - A remote függvényből érkezett hiba.
 * @returns Igaz, ha a hiba részletei nem kerülhetnek ki a felületre.
 */
export function isInternalError(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;

	if (err instanceof Error && RUNTIME_ERROR_NAMES.has(err.name)) return true;

	const candidate = err as { severity?: unknown; code?: unknown; routine?: unknown };

	if (typeof candidate.severity === 'string' && typeof candidate.code === 'string') return true;
	if (typeof candidate.routine === 'string' && typeof candidate.code === 'string') return true;

	if (typeof candidate.code === 'string') {
		return SQLSTATE_PATTERN.test(candidate.code) || SYSTEM_ERROR_CODE_PATTERN.test(candidate.code);
	}

	return false;
}

/**
 * Hivatkozási azonosító: ezzel köthető össze a felületi üzenet a szerver loggal.
 *
 * @returns Nyolc karakteres hexadecimális azonosító.
 */
export function createErrorReference(): string {
	return Math.random().toString(16).slice(2, 10).padStart(8, '0');
}

/**
 * A kliensnek visszaadható hibaüzenet.
 *
 * @param err - A remote függvényből érkezett hiba.
 * @returns {object} `message` a felületen megjeleníthető szöveg, `reference` a
 * log-hivatkozás (csak belső hiba esetén), `internal` pedig igaz, ha az eredeti
 * üzenetet elrejtettük.
 */
export function toClientError(err: unknown): {
	message: string;
	reference?: string;
	internal: boolean;
} {
	if (isInternalError(err)) {
		const reference = createErrorReference();
		return {
			message: `${GENERIC_REMOTE_ERROR_MESSAGE} (ref: ${reference})`,
			reference,
			internal: true
		};
	}

	if (err instanceof Error && err.message) {
		return { message: err.message, internal: false };
	}

	return { message: 'Remote function execution failed', internal: false };
}
