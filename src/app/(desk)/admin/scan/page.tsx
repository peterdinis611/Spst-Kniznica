import { FolioLink as Link } from '@/components/FolioLink';
import { pageMeta } from '@/utils/metadata';
import { canOperateDesk } from '@/server/admin-access';
import { deskScanLookup } from '@/server/desk/scan-lookup';
import { getSessionReader } from '@/server/session';
import { looksLikeIsbn } from '@/utils/isbn';

export const metadata = pageMeta({
	title: 'Čítačka',
	description: 'Pultová čítačka — inventár, ISBN a Open Library.',
	index: false
});

export default async function AdminScanPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const user = await getSessionReader();
	if (!user || !canOperateDesk(user)) {
		return <p className="pult-empty">Čítačka je len pre knihovníka.</p>;
	}

	const { q = '' } = await searchParams;
	const code = q.trim();
	const lookup = code.length >= 2 ? await deskScanLookup(code) : null;

	return (
		<div className="pult-scan-page">
			<p className="pult-queue-kicker">00 čítačka</p>
			<h2 className="pult-hopper-title">Inventár a ISBN</h2>
			<p className="pult-lede">
				Naskenuj chrbát, alebo dopíš ISBN. Vo fonde padne lístok. Keď zväzok ešte nie je, Open
				Library ho doplní.
			</p>

			<form className="pult-scan" method="GET">
				<nav className="pult-scan-modes" aria-label="Režim čítačky">
					<span className="is-on">Lístok</span>
				</nav>
				<label className="pult-scan-pad">
					<span>ISBN, inventár alebo signatúra</span>
					<input name="q" defaultValue={code} autoFocus autoComplete="off" spellCheck={false} />
				</label>
				<button type="submit">Hľadať</button>
			</form>

			{lookup ? <ScanResult code={code} lookup={lookup} /> : null}
		</div>
	);
}

function ScanResult({
	code,
	lookup
}: {
	code: string;
	lookup: Awaited<ReturnType<typeof deskScanLookup>>;
}) {
	const { hit, card, isbnNote } = lookup;

	if (hit.kind === 'borrow') {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">voľný kus</p>
				<h3>{hit.copy.title}</h3>
				<p>
					{hit.copy.callNumber} · {hit.copy.inventoryNo}
				</p>
				<Link href={`/books/${hit.copy.bookId}`}>Otvoriť kartu</Link>
			</article>
		);
	}

	if (hit.kind === 'return') {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">vonku</p>
				<h3>{hit.copy.title}</h3>
				<p>
					{hit.loan.readerName}
					{hit.loan.borrowerClass ? ` · ${hit.loan.borrowerClass}` : ''}
				</p>
				<Link href={`/books/${hit.copy.bookId}`}>Otvoriť kartu</Link>
			</article>
		);
	}

	if (hit.kind === 'isbn-out') {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">všetky vonku</p>
				<h3>{hit.copy.title}</h3>
				<p>{hit.open} výtlačkov je vypožičaných.</p>
				<Link href={`/books/${hit.copy.bookId}`}>Otvoriť kartu</Link>
			</article>
		);
	}

	if (hit.kind === 'blocked') {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">zaseknuté</p>
				<h3>{hit.copy.title}</h3>
				<p>{hit.message}</p>
			</article>
		);
	}

	if (card) {
		return (
			<article className="pult-scan-card is-isbn">
				<p className="pult-queue-kicker">doplň z isbn</p>
				<h3>{card.title}</h3>
				{card.subtitle ? <p>{card.subtitle}</p> : null}
				<p>
					{[card.authors.join(', '), card.year, card.publisher, card.isbn]
						.filter(Boolean)
						.join(' · ')}
				</p>
				{card.description ? <p>{card.description}</p> : null}
				<p className="pult-scan-note">
					Vo fonde tento zväzok nie je. Open Library ho doplnila — založíš ho v zásuvke Knihy.
				</p>
			</article>
		);
	}

	return (
		<article className="pult-scan-card">
			<p className="pult-queue-kicker">nenašiel som</p>
			<h3>{code}</h3>
			<p>
				{isbnNote ??
					(looksLikeIsbn(code)
						? 'Toto ISBN v Open Library nie je.'
						: 'Ani inventár, ani ISBN v tomto fonde.')}
			</p>
		</article>
	);
}
