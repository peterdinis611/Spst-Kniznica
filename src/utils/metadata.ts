import type { Metadata } from 'next';

const SITE = 'SPŠT knižnica';

export function pageMeta(input: {
	title: string;
	description: string;
	index?: boolean;
	type?: 'website' | 'article' | 'book';
}): Metadata {
	const fullTitle =
		input.title === SITE
			? `${SITE} — školský fond učebníc a literatúry`
			: `${input.title} · ${SITE}`;
	const index = input.index ?? true;
	return {
		title: fullTitle,
		description: input.description,
		applicationName: SITE,
		authors: [{ name: SITE }],
		robots: index ? { index: true, follow: true } : { index: false, follow: false },
		alternates: { languages: { sk: './' } },
		openGraph: {
			siteName: SITE,
			locale: 'sk_SK',
			type: input.type === 'article' ? 'article' : 'website',
			title: fullTitle,
			description: input.description
		},
		twitter: {
			card: 'summary',
			title: fullTitle,
			description: input.description
		}
	};
}
