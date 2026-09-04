import type { NextConfig } from 'next';

const originHost = (() => {
	const raw = process.env.ORIGIN?.trim();
	if (!raw) return undefined;
	try {
		return new URL(raw.startsWith('http') ? raw : `https://${raw}`).host;
	} catch {
		return undefined;
	}
})();

const coverHosts = [
	'images.unsplash.com',
	'utfs.io',
	'ufs.sh',
	'uploadthing.com',
	'*.utfs.io',
	'*.ufs.sh',
	'*.uploadthing.com',
	'*.supabase.co'
] as const;

const securityHeaders = [
	{ key: 'X-DNS-Prefetch-Control', value: 'on' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
	},
	...(process.env.NODE_ENV === 'production'
		? [
				{
					key: 'Strict-Transport-Security',
					value: 'max-age=63072000; includeSubDomains; preload'
				}
			]
		: [])
];

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	trailingSlash: false,
	typedRoutes: false,
	output: 'standalone',
	productionBrowserSourceMaps: false,
	serverExternalPackages: ['postgres', 'drizzle-orm', 'better-auth'],
	httpAgentOptions: { keepAlive: true },
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
	},
	experimental: {
		optimizePackageImports: ['lucide-react', 'valibot', 'next-safe-action'],
		serverActions: {
			bodySizeLimit: '2mb',
			allowedOrigins: originHost ? [originHost] : undefined
		}
	},
	logging: {
		fetches: { fullUrl: true }
	},
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60 * 60 * 24 * 7,
		dangerouslyAllowSVG: false,
		contentDispositionType: 'inline',
		deviceSizes: [360, 640, 768, 1024, 1280],
		imageSizes: [64, 96, 128, 256, 384],
		remotePatterns: coverHosts.map((hostname) => ({
			protocol: 'https' as const,
			hostname
		}))
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: securityHeaders
			},
			{
				source: '/api/:path*',
				headers: [{ key: 'Cache-Control', value: 'no-store' }]
			}
		];
	}
};

export default nextConfig;
