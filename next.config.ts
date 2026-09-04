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

const yearCache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	trailingSlash: false,
	typedRoutes: false,
	output: 'standalone',
	productionBrowserSourceMaps: false,
	serverExternalPackages: [
		'postgres',
		'drizzle-orm',
		'better-auth',
		'pg-boss',
		'pg',
		'pg-connection-string'
	],
	httpAgentOptions: { keepAlive: true },
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
	},
	experimental: {
		optimizePackageImports: [
			'lucide-react',
			'valibot',
			'next-safe-action',
			'sonner',
			'next-themes'
		],
		staleTimes: {
			dynamic: 30,
			static: 180
		},
		serverActions: {
			bodySizeLimit: '2mb',
			allowedOrigins: originHost ? [originHost] : undefined
		}
	},
	...(process.env.NODE_ENV === 'development' ? { logging: { fetches: { fullUrl: true } } } : {}),
	webpack: (config, { isServer }) => {
		if (isServer && Array.isArray(config.externals)) {
			config.externals.push('pg-boss', 'pg', 'pg-connection-string');
		}
		return config;
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
			},
			{ source: '/brand/:path*', headers: yearCache },
			{ source: '/icon.png', headers: yearCache },
			{ source: '/apple-touch-icon.png', headers: yearCache },
			{
				source: '/favicon.ico',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }]
			}
		];
	}
};

export default nextConfig;
