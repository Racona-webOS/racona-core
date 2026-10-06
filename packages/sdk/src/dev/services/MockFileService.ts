/**
 * Mock File Service
 *
 * Simulates uploads in standalone development: the file is not sent anywhere,
 * the result has a random file ID (or comes from the configured handler).
 */

import type {
	FileService,
	FileUploadOptions,
	FileUploadResult,
	MockSDKConfig
} from '../../types/index.js';

/** Mock file service — simulated uploads for standalone development. */
export class MockFileService implements FileService {
	private readonly handler?: NonNullable<MockSDKConfig['files']>['upload'];

	/** @param config - Optional custom upload handler */
	constructor(config?: MockSDKConfig['files']) {
		this.handler = config?.upload;
	}

	/** Simulate an upload */
	async upload(uploadUrl: string, file: Blob, options: FileUploadOptions = {}): Promise<FileUploadResult> {
		options.onProgress?.({ loaded: file.size, total: file.size });
		console.log('[MockSDK] files.upload', uploadUrl, file);
		if (this.handler) return this.handler(uploadUrl, file);
		return {
			fileId: globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}`,
			originalName: (file as Blob & { name?: string }).name ?? 'file',
			mimeType: file.type || 'application/octet-stream',
			size: file.size
		};
	}
}
