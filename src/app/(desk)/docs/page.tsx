import Link from 'next/link';
import { pageMeta } from '@/utils/metadata';

export const metadata = pageMeta({
	title: 'Príručka',
	description: 'Príručka školskej knižnice SPŠT.',
	index: false
});

export default function DocsPage() {
	return (
		<article className="max-w-2xl">
			<p className="folio-kicker">Príručka</p>
			<h1 className="font-display mt-2 text-4xl">Ako fond berie.</h1>
			<p className="mt-4 max-w-[46ch] leading-relaxed text-muted-foreground">
				Katalóg, výpožička na 7–21 dní a pult v pavilóne B. Podrobná príručka sa sem vráti ako MDX v
				ďalšom kroku.
			</p>
			<p className="mt-8">
				<Link href="/" className="underline">
					Späť na sieň
				</Link>
			</p>
		</article>
	);
}
