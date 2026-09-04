import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { supabasePublic } from '@/config/supabase';

export function supabaseAdmin(): SupabaseClient | null {
	const { url } = supabasePublic();
	const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim().replace(/^['"]+|['"]+$/g, '');
	if (!url || !key) return null;

	return createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}
