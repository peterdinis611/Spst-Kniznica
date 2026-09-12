import type { MetadataRoute } from 'next';
import { listDocChapters } from '@/docs/source';

function siteOrigin() {
	const raw = process.env.ORIGIN?.trim();
	if (!raw) return 'http://localhost:3000';
	return raw.startsWith('http') ? raw.replace(/\/$/, '') : `https://${raw}`;
}

const PUBLIC_PATHS = [
	'/',
	'/discover',
	'/books',
	'/holdings',
	'/departments',
	'/authors',
	'/login'
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
	const origin = siteOrigin();
	const docs = listDocChapters().map((chapter) => chapter.url);
	return [...PUBLIC_PATHS, ...docs].map((path) => ({
		url: `${origin}${path === '/' ? '' : path}`,
		changeFrequency: path.startsWith('/docs') ? 'monthly' : 'weekly',
		priority: path === '/' ? 1 : path.startsWith('/docs') ? 0.4 : 0.7
	}));
}
