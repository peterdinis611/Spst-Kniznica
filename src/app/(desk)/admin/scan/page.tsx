import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { LOAN_DAY_OPTIONS } from '@/desk/borrow-fields';
import { pageMeta } from '@/utils/metadata';
import { canOperateDesk } from '@/server/admin-access';
import { getOpenInventoryRun } from '@/server/desk/inventory';
import { deskScanLookup } from '@/server/desk/scan-lookup';
import { readerOptions } from '@/server/desk/options';
import { getSessionReader } from '@/server/session';
import { looksLikeIsbn } from '@/utils/isbn';
import {
	scanBorrow,
	scanCloseWalk,
	scanFound,
	scanLost,
	scanOpenWalk,
	scanReturn
} from './actions';

export const metadata = pageMeta({
	title: 'Čítačka',
	description: 'Pultová čítačka — výpožička, vrátenie a inventúra.',
	index: false
});

export default async function AdminScanPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; mode?: string; stamp?: string; fault?: string }>;
}) {
	const user = await getSessionReader();
	if (!user || !canOperateDesk(user)) {
		return <p className="pult-empty">Čítačka je len pre knihovníka.</p>;
	}

	const { q = '', mode = '', stamp, fault } = await searchParams;
	const inventura = mode === 'inventura';
	const code = q.trim();
	const lookup = code.length >= 2 ? await deskScanLookup(code) : null;
	const walk = inventura ? await getOpenInventoryRun() : null;
	const readers = lookup?.hit.kind === 'borrow' && !inventura ? await readerOptions() : [];

	return (
		<div className="pult-scan-page">
			<p className="pult-queue-kicker">00 čítačka</p>
			<h2 className="pult-hopper-title">Inventár a ISBN</h2>
			<p className="pult-lede">
				Naskenuj chrbát, alebo dopíš ISBN. Vo fonde padne výpožička alebo vrátenie. V režime
				inventúra pečiatkuješ nález a stratu.
			</p>
			<PultBlot stamp={stamp} fault={fault} />

			<form className="pult-scan" method="GET">
				<nav className="pult-scan-modes" aria-label="Režim čítačky">
					<Link className={inventura ? undefined : 'is-on'} href="/admin/scan">
						Lístok
					</Link>
					<Link className={inventura ? 'is-on' : undefined} href="/admin/scan?mode=inventura">
						Inventúra
					</Link>
				</nav>
				{inventura ? <input type="hidden" name="mode" value="inventura" /> : null}
				<label className="pult-scan-pad">
					<span>ISBN, inventár alebo signatúra</span>
					<input name="q" defaultValue={code} autoFocus autoComplete="off" spellCheck={false} />
				</label>
				<button type="submit">Hľadať</button>
			</form>

			{inventura ? (
				<div className="pult-scan-walk">
					{walk ? (
						<>
							<p className="pult-note">
								Chôdza beží · {walk.found} nájdených · od {walk.startedAt.toLocaleString('sk-SK')}
							</p>
							<form action={scanCloseWalk}>
								<button type="submit">Uzavrieť inventúru</button>
							</form>
						</>
					) : (
						<form action={scanOpenWalk}>
							<button type="submit">Otvoriť chôdzu</button>
						</form>
					)}
				</div>
			) : null}

			{lookup ? (
				<ScanResult code={code} lookup={lookup} inventura={inventura} readers={readers} />
			) : null}
		</div>
	);
}

function ScanResult({
	code,
	lookup,
	inventura,
	readers
}: {
	code: string;
	lookup: Awaited<ReturnType<typeof deskScanLookup>>;
	inventura: boolean;
	readers: Awaited<ReturnType<typeof readerOptions>>;
}) {
	const { hit, card, isbnNote } = lookup;

	if (inventura && (hit.kind === 'borrow' || hit.kind === 'return' || hit.kind === 'blocked')) {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">inventúra</p>
				<h3>{hit.copy.title}</h3>
				<p>
					{hit.copy.callNumber} · {hit.copy.inventoryNo}
				</p>
				<div className="pult-actions">
					<form action={scanFound}>
						<input type="hidden" name="q" value={code} />
						<input type="hidden" name="holdingId" value={hit.copy.id} />
						<button type="submit">Nájdený</button>
					</form>
					<form action={scanLost}>
						<input type="hidden" name="q" value={code} />
						<input type="hidden" name="holdingId" value={hit.copy.id} />
						<button type="submit" className="pult-ghost">
							Stratený
						</button>
					</form>
				</div>
			</article>
		);
	}

	if (hit.kind === 'borrow') {
		return (
			<article className="pult-scan-card">
				<p className="pult-queue-kicker">voľný kus</p>
				<h3>{hit.copy.title}</h3>
				<p>
					{hit.copy.callNumber} · {hit.copy.inventoryNo}
				</p>
				<form className="pult-form" action={scanBorrow}>
					<input type="hidden" name="q" value={code} />
					<input type="hidden" name="bookId" value={hit.copy.bookId} />
					<input type="hidden" name="holdingId" value={hit.copy.id} />
					<div className="pult-fields is-2">
						<label className="pult-field is-wide">
							<span>Čitateľ</span>
							<select name="userId" required defaultValue="">
								<option value="">—</option>
								{readers.map((reader) => (
									<option key={reader.id} value={reader.id}>
										{reader.name}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Meno</span>
							<input name="borrowerFirstName" required defaultValue="" />
						</label>
						<label className="pult-field">
							<span>Priezvisko</span>
							<input name="borrowerLastName" required defaultValue="" />
						</label>
						<label className="pult-field">
							<span>Trieda</span>
							<input name="borrowerClass" />
						</label>
						<label className="pult-field">
							<span>Dni</span>
							<select name="loanDays" defaultValue="21">
								{LOAN_DAY_OPTIONS.map((days) => (
									<option key={days} value={days}>
										{days}
									</option>
								))}
							</select>
						</label>
					</div>
					<div className="pult-submit">
						<button type="submit">Vypožičať</button>
						<Link href={`/books/${hit.copy.bookId}`}>Otvoriť kartu</Link>
					</div>
				</form>
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
				<form action={scanReturn}>
					<input type="hidden" name="q" value={code} />
					<input type="hidden" name="id" value={hit.loan.id} />
					<button type="submit">Vrátiť na pult</button>
				</form>
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
				<p className="pult-scan-note">
					Vo fonde tento zväzok nie je. Open Library ho doplnila — založíš ho v zásuvke Knihy.
				</p>
				<Link href={`/admin/books?q=${encodeURIComponent(card.isbn)}`}>Otvoriť Knihy</Link>
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
