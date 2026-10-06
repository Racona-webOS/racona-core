/**
 * File Service
 *
 * Upload files to the core file storage through a signed link created by the
 * plugin's server code (`context.files.createUploadUrl`). The file is sent as
 * the raw request body, with progress reporting.
 */

import type {
	FileService as IFileService,
	FileUploadError,
	FileUploadOptions,
	FileUploadResult
} from '../../types/index.js';

function uploadError(message: string, status?: number, code?: string): FileUploadError {
	const error = new Error(message) as FileUploadError;
	error.name = 'FileUploadError';
	if (status !== undefined) error.status = status;
	if (code) error.code = code;
	return error;
}

function parseResponse(status: number, text: string): FileUploadResult {
	let body: Record<string, unknown> = {};
	try {
		body = text ? JSON.parse(text) : {};
	} catch {
		// nem JSON válasz (pl. proxy hiba)
	}
	if (status >= 200 && status < 300 && typeof body.fileId === 'string') {
		return body as unknown as FileUploadResult;
	}
	const message = typeof body.error === 'string' ? body.error : `Upload failed (HTTP ${status})`;
	throw uploadError(message, status, typeof body.code === 'string' ? body.code : undefined);
}

/** File service — uploads files to links created by the plugin's server code. */
export class FileService implements IFileService {
	/** Plugin identifier; only this plugin's upload links are accepted */
	private readonly pluginId: string;

	/** @param pluginId - Unique plugin identifier */
	constructor(pluginId: string) {
		this.pluginId = pluginId;
	}

	/**
	 * Upload a file.
	 *
	 * @param uploadUrl - The link returned by `context.files.createUploadUrl()`
	 * @param file - The file (e.g. from an `<input type="file">`)
	 * @param options - Progress callback and abort signal
	 * @returns The stored file; pass `fileId` to a remote function that claims it
	 * @throws `FileUploadError` with `code` (e.g. `FILE_TOO_LARGE`, `INVALID_MIME`) when rejected
	 */
	upload(uploadUrl: string, file: Blob, options: FileUploadOptions = {}): Promise<FileUploadResult> {
		const prefix = `/api/plugins/${this.pluginId}/files/upload/`;
		if (typeof uploadUrl !== 'string' || !uploadUrl.startsWith(prefix)) {
			return Promise.reject(uploadError('Invalid upload URL'));
		}
		const fileName = (file as Blob & { name?: string }).name ?? 'file';
		const headers: Record<string, string> = {
			'Content-Type': 'application/octet-stream',
			'X-File-Name': encodeURIComponent(fileName)
		};

		if (typeof XMLHttpRequest === 'undefined') {
			return fetch(uploadUrl, {
				method: 'POST',
				body: file,
				headers,
				credentials: 'same-origin',
				signal: options.signal
			}).then(async (response) => parseResponse(response.status, await response.text()));
		}

		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', uploadUrl);
			xhr.withCredentials = true;
			for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);

			if (options.onProgress) {
				const onProgress = options.onProgress;
				xhr.upload.onprogress = (event) => {
					onProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : file.size });
				};
			}

			const abort = () => xhr.abort();
			options.signal?.addEventListener('abort', abort, { once: true });
			const cleanup = () => options.signal?.removeEventListener('abort', abort);

			xhr.onload = () => {
				cleanup();
				try {
					resolve(parseResponse(xhr.status, xhr.responseText));
				} catch (error) {
					reject(error);
				}
			};
			xhr.onerror = () => {
				cleanup();
				reject(uploadError('Network error during upload', 0, 'NETWORK_ERROR'));
			};
			xhr.onabort = () => {
				cleanup();
				reject(uploadError('Upload aborted', 0, 'ABORTED'));
			};

			if (options.signal?.aborted) {
				xhr.abort();
				return;
			}
			xhr.send(file);
		});
	}
}
