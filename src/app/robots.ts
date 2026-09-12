import type { MetadataRoute } from 'next';

function siteOrigin() {
	const raw = process.env.ORIGIN?.trim();
	if (!raw) return 'http://localhost:3000';
	return raw.startsWith('http') ? raw.replace(/\/$/, '') : `https://${raw}`;
}

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: ['/admin', '/admin/', '/loans', '/profile', '/api/']
		},
		sitemap: `${siteOrigin()}/sitemap.xml`
	};
}
