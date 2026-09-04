import type { Metadata } from 'next';
import { Providers } from './providers';
import { ensureHall } from '@/server/boot';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
	title: 'SPŠT knižnica — školský fond učebníc a literatúry',
	description:
		'Školská knižnica SPŠT — katalóg učebníc, noriem a literatúry. Výpožička na 7, 14 alebo 21 dní, bez stropu na počet kníh.',
	applicationName: 'SPŠT knižnica',
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: '48x48' },
			{ url: '/icon.png', type: 'image/png', sizes: '192x192' }
		],
		apple: '/apple-touch-icon.png'
	}
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	await ensureHall();
	return (
		<html lang="sk" className={fontVariables} suppressHydrationWarning>
			<head>
				<meta name="apple-mobile-web-app-title" content="SPŠT knižnica" />
				<meta name="format-detection" content="telephone=no" />
				<link rel="preconnect" href="https://images.unsplash.com" />
				<link rel="dns-prefetch" href="https://images.unsplash.com" />
			</head>
			<body>
				<a className="skip-link" href="#obsah">
					Preskočiť na obsah
				</a>
				<form id="logout-form" method="POST" action="/logout" className="hidden" />
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
