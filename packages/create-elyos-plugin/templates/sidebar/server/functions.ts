/**
 * Szerver oldali függvények
 *
 * Ezek a függvények az ElyOS szerveren futnak,
 * és a plugin a remote.call()-lal hívhatja őket.
 */

export async function getServerTime(): Promise<{ time: string }> {
	return {
		time: new Date().toISOString()
	};
}
