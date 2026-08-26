import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { supabasePublic } from '$lib/supabase/config';

export function supabaseAdmin(): SupabaseClient | null {
	const { url } = supabasePublic();
	const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim().replace(/^['"]+|['"]+$/g, '');
	if (!url || !key) return null;

	return createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}
