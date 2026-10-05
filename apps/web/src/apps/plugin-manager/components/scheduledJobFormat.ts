/**
 * Ütemezett feladatok — megjelenítési segédek (dátum, időtartam, státusz).
 */

import type { BadgeVariant } from '$lib/components/ui/badge';
import type { ScheduledJobView } from '../scheduler.remote';

export function formatDateTime(iso: string, locale: string): string {
	return new Intl.DateTimeFormat(locale === 'hu' ? 'hu-HU' : 'en-GB', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(iso));
}

export function formatDuration(ms: number | null): string {
	if (ms === null || ms === undefined) return '';
	if (ms < 1000) return `${ms} ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)} s`;
	return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
}

/** A feladat leírása a felület nyelvén, vagy null. */
export function jobDescription(
	job: Pick<ScheduledJobView, 'description'>,
	locale: string
): string | null {
	const d = job.description;
	if (!d) return null;
	if (typeof d === 'string') return d;
	return d[locale] ?? d.hu ?? d.en ?? Object.values(d)[0] ?? null;
}

export function statusVariant(status: string): BadgeVariant {
	switch (status) {
		case 'success':
			return 'default';
		case 'failed':
		case 'timeout':
			return 'destructive';
		case 'running':
			return 'outline';
		default:
			return 'secondary';
	}
}
