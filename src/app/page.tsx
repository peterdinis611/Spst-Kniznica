import { HallChrome } from '@/components/HallChrome';
import { FolioShelf } from '@/components/FolioShelf';
import { CoverRail } from '@/components/CoverRail';
import { booksLabel, initials } from '@/utils/format';
import { authorSwatch } from '@/catalog/cover';
import { pageMeta } from '@/utils/metadata';
import { layoutChrome } from '@/server/session';
import {
	catalogStats,
	listAuthorSlips,
	listBookSlips,
	listCategoryChips,
	toSearchItem
} from '@/server/library';

export const metadata = pageMeta({
	title: 'SPŠT knižnica',
	description:
		'Školská knižnica SPŠT — katalóg učebníc, noriem a literatúry. Výpožička na 7, 14 alebo 21 dní, bez stropu na počet kníh. Pavilón B, Po—Pia 7:30—15:30.'
});

export default async function HomePage() {
	const chrome = await layoutChrome('/');
	const [slipsRaw, authorsRaw, stats, categories] = await Promise.all([
		listBookSlips(),
		listAuthorSlips(),
		catalogStats(),
		listCategoryChips()
	]);
	const slips = slipsRaw.filter((book) => book.id !== 'book-modlitbicky');
	const ready = slips.filter((book) => book.copiesAvailable > 0);
	const authors = [...authorsRaw].sort((a, b) => b.bookCount - a.bookCount);
	const books = ready.slice(0, 16);
	const ledger = ready.slice(16, 28);
	const shelf = slips.slice(0, 81).map((book) => ({ id: book.id, title: book.title }));
	const searchPreview = ready.slice(0, 10).map(toSearchItem);

	return (
		<main id="obsah" className="landing-shell">
			<HallChrome user={chrome.user} admin={chrome.admin} searchPreview={searchPreview}>
				<section className="folio">
					<h1>Učebnice a príbehy, ktoré SPŠT ešte nedočítalo.</h1>
					<p className="folio-lead">
						Na polici sú skutočné zväzky z fondu — {stats.available} voľných výtlačkov z {stats.books} kníh.
						Klikni na chrbát alebo menovku.
					</p>
					<a className="folio-cta no-underline" href="/discover">
						Vstúpiť do fondu
					</a>
					<FolioShelf books={shelf} />
					{categories.length ? (
						<nav className="folio-odbory" aria-label="Odbory vo fonde">
							{categories.map((cat) => (
								<a key={cat.id} className="no-underline" href={`/departments/${cat.slug}`}>
									<em>{cat.code}</em>
									{cat.name}
									<span>{cat.bookCount}</span>
								</a>
							))}
						</nav>
					) : null}
				</section>

				<section className="folio-block" id="ako">
					<p className="folio-kicker">Ako to tu funguje</p>
					<h2>Tri kroky od police k výpožičke.</h2>
					<ol className="folio-steps">
						<li>
							<span>01</span>
							<h3>Nájdi vo fonde</h3>
							<p>Hľadaj podľa názvu, autora alebo signatúry. Voľné výtlačky uvidíš hneď.</p>
						</li>
						<li>
							<span>02</span>
							<h3>Požičaj na účet</h3>
							<p>
								Prihlás sa a vezmi toľko kníh, koľko potrebuješ. Lehotu 7, 14 alebo 21 dní vyberieš na lístku, bez
								poplatku.
							</p>
						</li>
						<li>
							<span>03</span>
							<h3>Vráť v pavilóne B</h3>
							<p>
								Odnes zväzok na 1. poschodie. Na lístku ho nahlásiš, voľný kus spadne po čítačke. Po—Pia 7:30—15:30.
							</p>
						</li>
					</ol>
				</section>

				<section className="folio-block">
					<div className="folio-head">
						<div>
							<p className="folio-kicker">Pracovné zväzky</p>
							<h2>Otoč policu a vyber knihu, ktorú otvoríš hneď.</h2>
						</div>
						<a className="folio-cta folio-cta-sm no-underline" href="/books">
							Celý katalóg
						</a>
					</div>
					<p className="folio-shelf-hint">Otoč zväzok šípami alebo ťahaním.</p>
					<CoverRail books={books} />
				</section>

				{ledger.length ? (
					<section className="folio-block">
						<div className="folio-head">
							<div>
								<p className="folio-kicker">Register</p>
								<h2>Ďalšie voľné zväzky z kartotéky.</h2>
							</div>
							<a className="folio-cta folio-cta-sm no-underline" href="/books">
								Celý katalóg
							</a>
						</div>
						<div className="folio-picks">
							{ledger.map((book) => (
								<a key={book.id} className="folio-pick no-underline" href={`/books/${book.id}`}>
									<em>
										{book.category.code} · {book.callNumber}
									</em>
									<strong>{book.title}</strong>
									<span>{book.authors.map((person) => person.name).join(' · ')}</span>
									<b className={book.copiesAvailable === 0 ? 'is-out' : undefined}>
										{book.copiesAvailable > 0 ? 'Voľná' : 'Vonku'}
									</b>
								</a>
							))}
						</div>
					</section>
				) : null}

				<section className="folio-block">
					<div className="folio-head">
						<div>
							<p className="folio-kicker">Menný katalóg</p>
							<h2>Autori, ktorých držíme na polici.</h2>
						</div>
						<a className="folio-cta folio-cta-sm no-underline" href="/authors">
							Všetci autori
						</a>
					</div>
					<ul className="folio-authors">
						{authors.slice(0, 12).map((author) => (
							<li key={author.id}>
								<a className="folio-author no-underline" href={`/authors/${author.slug}`}>
									<span className="folio-avatar" style={{ background: authorSwatch(author.id) }}>
										{initials(author.name)}
									</span>
									<span>
										<strong>{author.name}</strong>
										<em>{booksLabel(author.bookCount)}</em>
									</span>
								</a>
							</li>
						))}
					</ul>
				</section>

				<section className="folio-close">
					<div>
						<p className="folio-kicker">Čitateľský účet</p>
						<h2>
							{chrome.user
								? 'Máš účet. Kniha je tvoja na lehotu z lístka.'
								: 'Prihlás sa a kniha je tvoja na 7, 14 alebo 21 dní.'}
						</h2>
					</div>
					<div className="folio-close-actions">
						{chrome.user ? (
							<a className="folio-cta no-underline" href="/loans">
								Moje výpožičky
							</a>
						) : (
							<a className="folio-cta no-underline" href="/login">
								Prihlásiť sa
							</a>
						)}
						<a className="folio-ghost no-underline" href="/discover">
							Prezrieť fond
						</a>
					</div>
				</section>
			</HallChrome>
		</main>
	);
}
