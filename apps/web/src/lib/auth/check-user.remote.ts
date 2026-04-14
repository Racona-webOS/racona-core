import { command } from '$app/server';
import * as v from 'valibot';
import db from '$lib/server/database';
import { users } from '@racona/database/schemas';
import { eq } from 'drizzle-orm';

/**
 * Email validációs séma
 */
const checkUserSchema = v.object({
	email: v.pipe(v.string(), v.email())
});

/**
 * Ellenőrzi, hogy létezik-e felhasználó a megadott email címmel.
 */
export const checkUserExists = command(checkUserSchema, async ({ email }): Promise<boolean> => {
	const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

	return user.length > 0;
});
