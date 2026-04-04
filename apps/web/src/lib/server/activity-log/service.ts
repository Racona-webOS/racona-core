import { activityLogRepository } from './repository';
import type { ActivityLogInput } from './types';
import { env } from '$lib/env';

// Aktivitás napló szolgáltatás — bejegyzések rögzítéséhez
export class ActivityLogService {
	async log(input: ActivityLogInput): Promise<void> {
		// Ha a naplózás ki van kapcsolva env szinten, azonnal visszatérünk
		if ((env as any).ACTIVITY_LOG_ENABLED === false) {
			return;
		}

		try {
			await activityLogRepository.insert(input);
		} catch (error) {
			// Fire-and-forget: hiba esetén naplózunk, de nem dobunk kivételt,
			// hogy az aktivitás naplózás ne akadályozza az üzleti logikát
			console.error('[ActivityLogService] Hiba az aktivitás bejegyzés mentésekor:', error);
		}
	}
}

export const activityLogService = new ActivityLogService();
