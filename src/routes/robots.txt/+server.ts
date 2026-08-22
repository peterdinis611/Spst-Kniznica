import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /loans
Disallow: /login
Disallow: /logout
Disallow: /demo

Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'max-age=86400'
		}
	});
};
