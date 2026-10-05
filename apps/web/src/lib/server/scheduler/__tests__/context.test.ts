/**
 * Futásnapló és eredmény normalizálás (.kiro/specs/plugin-scheduler, 5.5, 5.6).
 */

import { describe, it, expect, vi } from 'vitest';
import {
	createRunLogger,
	MAX_LOG_LINE_LENGTH,
	MAX_LOG_LINES,
	MAX_RESULT_BYTES,
	normalizeJobResult
} from '../context';

describe('createRunLogger', () => {
	it('collects lines with level and timestamp', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const logger = createRunLogger('demo/job');
		logger.info('hello');
		logger.warn('careful');
		const lines = logger.lines();
		expect(lines.map((l) => [l.level, l.message])).toEqual([
			['info', 'hello'],
			['warn', 'careful']
		]);
		expect(() => new Date(lines[0].at).toISOString()).not.toThrow();
	});

	it('limits the number and length of lines', () => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const logger = createRunLogger('demo/job');
		for (let i = 0; i < MAX_LOG_LINES + 5; i++) logger.info('x'.repeat(MAX_LOG_LINE_LENGTH + 10));
		const lines = logger.lines();
		expect(lines).toHaveLength(MAX_LOG_LINES + 1);
		expect(lines[0].message.length).toBe(MAX_LOG_LINE_LENGTH + 1);
		expect(lines.at(-1)?.message).toMatch(/5 more log lines dropped/);
	});
});

describe('normalizeJobResult', () => {
	it('keeps summary and data', () => {
		expect(normalizeJobResult({ summary: 'ok', data: { sent: 3 }, other: 1 })).toEqual({
			summary: 'ok',
			data: { sent: 3 }
		});
	});

	it('returns null for empty or non-object values', () => {
		expect(normalizeJobResult(undefined)).toBeNull();
		expect(normalizeJobResult('done')).toBeNull();
		expect(normalizeJobResult({})).toBeNull();
	});

	it('truncates oversized results to the summary', () => {
		const big = { summary: 'big', data: { blob: 'x'.repeat(MAX_RESULT_BYTES) } };
		expect(normalizeJobResult(big)).toEqual({ summary: 'big', truncated: true });
	});
});
