import { env } from '$env/dynamic/public';

export function supabasePublic() {
	const url = env.PUBLIC_SUPABASE_URL?.trim() ?? '';
	const key =
		env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || env.PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

	return {
		url,
		key,
		configured: Boolean(url && key)
	};
}
