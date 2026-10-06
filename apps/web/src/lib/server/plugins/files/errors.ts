/**
 * A plugin fájltárolás hibái. A `code` alapján a plugin a saját nyelvén
 * fogalmazhatja meg az üzenetet; a végpontok HTTP státuszra fordítják.
 */

export type PluginFileErrorCode =
	| 'FILE_NOT_FOUND'
	| 'PERMISSION_DENIED'
	| 'INVALID_INPUT'
	| 'INVALID_MIME'
	| 'FILE_TOO_LARGE'
	| 'INVALID_TOKEN'
	| 'STORAGE_ERROR';

export class PluginFileError extends Error {
	constructor(
		public readonly code: PluginFileErrorCode,
		message: string
	) {
		super(message);
		this.name = 'PluginFileError';
	}
}

const HTTP_STATUS: Record<PluginFileErrorCode, number> = {
	FILE_NOT_FOUND: 404,
	PERMISSION_DENIED: 403,
	INVALID_INPUT: 400,
	INVALID_MIME: 415,
	FILE_TOO_LARGE: 413,
	INVALID_TOKEN: 403,
	STORAGE_ERROR: 500
};

export function httpStatusForFileError(code: PluginFileErrorCode): number {
	return HTTP_STATUS[code];
}
