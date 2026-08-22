import { docsSource } from '$lib/docs/source';
import { listAuthors, listBooks, listCategories } from '$lib/server/library';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const now = new Date().toISOString().slice(0, 10);

	const routes = [
		{ path: '/', changefreq: 'weekly', priority: '1.0' },
		{ path: '/discover', changefreq: 'weekly', priority: '0.9' },
		{ path: '/books', changefreq: 'weekly', priority: '0.9' },
		{ path: '/departments', changefreq: 'monthly', priority: '0.7' },
		{ path: '/authors', changefreq: 'monthly', priority: '0.7' },
		...docsSource.getPages().map((doc) => ({
			path: doc.url,
			changefreq: 'monthly',
			priority: '0.5'
		})),
		...listBooks().map((book) => ({
			path: `/books/${book.id}`,
			changefreq: 'monthly',
			priority: '0.8'
		})),
		...listCategories().map((category) => ({
			path: `/departments/${category.slug}`,
			changefreq: 'monthly',
			priority: '0.6'
		})),
		...listAuthors().map((author) => ({
			path: `/authors/${author.slug}`,
			changefreq: 'monthly',
			priority: '0.6'
		}))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
	.map(
		(route) => `  <url>
    <loc>${origin}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=3600'
		}
	});
};
