import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { aliasTarget } from '@/utils/route-aliases';
import { supabasePublic } from '@/config/supabase';

export async function middleware(request: NextRequest) {
	const dest = aliasTarget(request.nextUrl.pathname, request.nextUrl.search);
	if (dest) {
		return NextResponse.redirect(new URL(dest, request.url), 308);
	}

	const { url, key, configured } = supabasePublic();
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-pathname', request.nextUrl.pathname);
	const response = NextResponse.next({ request: { headers: requestHeaders } });
	if (!configured) return response;

	const supabase = createServerClient(url, key, {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
				cookiesToSet.forEach(({ name, value, options }) =>
					response.cookies.set(name, value, options)
				);
			}
		}
	});

	await supabase.auth.getClaims();
	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)']
};
