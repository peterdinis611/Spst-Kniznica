import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/config/env';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

type SqlClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
	__spstSql?: SqlClient;
};

function createClient() {
	return postgres(env.DATABASE_URL, {
		max: 4,
		idle_timeout: 20,
		max_lifetime: 60 * 30,
		connect_timeout: 10
	});
}

const client = globalForDb.__spstSql ?? createClient();
if (process.env.NODE_ENV !== 'production') globalForDb.__spstSql = client;

export const db = drizzle(client, { schema });
export const sqlClient = client;
