import { env } from '@/config/env';

export function supabasePublic() {
	const url = (env.NEXT_PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL)?.trim() ?? '';
	const key =
		(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim() ||
		(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY)?.trim() ||
		'';

	return {
		url,
		key,
		configured: Boolean(url && key)
	};
}
