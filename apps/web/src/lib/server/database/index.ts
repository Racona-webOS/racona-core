import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../../env';

import * as schema from '@racona/database/schemas';

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 20, // Optimize connection pool size
	min: 2, // Maintain minimum connections
	idleTimeoutMillis: 30000, // Close idle connections after 30s
	connectionTimeoutMillis: 5000, // Connection timeout
	// Performance monitoring
	log: (message: string, level: string) => {
		if (level === 'error') {
			console.error(`[DB Pool] ${message}`);
		} else if (process.env.NODE_ENV === 'development' && level === 'warn') {
			console.warn(`[DB Pool] ${message}`);
		}
	}
});

const db = drizzle(pool, {
	schema
});

export default db;
export { pool as client };
export type DB = typeof db;
