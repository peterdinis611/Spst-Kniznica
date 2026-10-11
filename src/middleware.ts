import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { aliasTarget } from '@/utils/route-aliases';
import { hasAuthCookies, supabasePublic } from '@/config/supabase';

export async function middleware(request: NextRequest) {
	const dest = aliasTarget(request.nextUrl.pathname, request.nextUrl.search);
	if (dest) {
		return NextResponse.redirect(new URL(dest, request.url), 308);
	}

	const path = request.nextUrl.pathname;
	const jar = request.cookies.getAll();
	if (path.startsWith('/admin') && !hasAuthCookies(jar)) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	const { url, key, configured } = supabasePublic();
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-pathname', path);
	const response = NextResponse.next({ request: { headers: requestHeaders } });
	if (!configured || !hasAuthCookies(jar)) return response;

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
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.png|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
	]
};
