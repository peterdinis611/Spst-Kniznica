'use client';

import { volumesLabel } from '@/utils/format';
import type { BookSlip, CategoryChip } from '@/types';
import { CatalogSlip } from './CatalogSlip';
import { PrintJacket } from './PrintJacket';
import { VirtualWindow } from './VirtualWindow';
import './fund-ledger.css';

const tilts = [-7, 4, -3, 6, -5, 3];

export function FundLedger({
	books,
	categories
}: {
	books: BookSlip[];
	categories: CategoryChip[];
}) {
	const ledger = categories
		.map((cat) => ({
			id: cat.id,
			code: cat.code,
			name: cat.name,
			slug: cat.slug,
			accent: cat.accent,
			books: books
				.filter((book) => book.category.id === cat.id)
				.toSorted((a, b) => a.title.localeCompare(b.title, 'sk'))
		}))
		.filter((group) => group.books.length > 0);
	const count = books.length;
	const virtual = count > 48;
	const rows = ledger.flatMap((group) => [
		{
			kind: 'head' as const,
			id: `head-${group.id}`,
			code: group.code,
			name: group.name,
			slug: group.slug,
			accent: group.accent,
			count: group.books.length
		},
		{
			kind: 'fan' as const,
			id: `fan-${group.id}`,
			slug: group.slug,
			accent: group.accent,
			preview: group.books.slice(0, 12)
		},
		...group.books.map((item) => ({ kind: 'book' as const, id: item.id, book: item }))
	]);

	function rowSize(index: number) {
		const row = rows[index];
		if (row?.kind === 'head') return 88;
		if (row?.kind === 'fan') return 168;
		return 76;
	}

	return (
		<>
			<header className="mast">
				<div className="mast-copy hidden md:block">
					<p className="kicker">Register fondu</p>
					<h1>Všetky knihy.</h1>
					<p className="lede">
						Kartotéka podľa odboru — signatúra vľavo, chrbát na lístku. Otvor zväzok a uvidíš, či je
						voľný.
					</p>
				</div>
				<aside className="mast-count">
					<strong>
						{count < 100 ? String(count).padStart(2, '0') : count.toLocaleString('sk-SK')}
					</strong>
					<span>{volumesLabel(count)}</span>
					{virtual ? <em>virtualizovaný register</em> : null}
					<a href="/books">Do katalógu →</a>
				</aside>
			</header>
			{virtual ? (
				<VirtualWindow count={rows.length} estimateSize={rowSize}>
					{(index) => {
						const item = rows[index];
						if (item?.kind === 'head') {
							return (
								<a
									className="lane-head"
									style={{ ['--accent' as string]: item.accent }}
									href={`/departments/${item.slug}`}
								>
									<strong>{item.code}</strong>
									<span>{item.name}</span>
									<b>{item.count}</b>
								</a>
							);
						}
						if (item?.kind === 'fan') {
							return (
								<div className="lane-fan" style={{ ['--accent' as string]: item.accent }}>
									{item.preview.map((book) => (
										<a key={book.id} className="fan-item" href={`/books/${book.id}`}>
											<PrintJacket
												book={book}
												linked={false}
												size="thumb"
												className="hover:!transform-none"
											/>
										</a>
									))}
								</div>
							);
						}
						if (item?.kind === 'book') return <CatalogSlip book={item.book} />;
						return null;
					}}
				</VirtualWindow>
			) : (
				<div className="folios">
					{ledger.map((group, gi) => (
						<section
							key={group.id}
							className="folio"
							style={
								{
									['--accent' as string]: group.accent,
									['--delay' as string]: `${0.08 + gi * 0.07}s`
								} as React.CSSProperties
							}
							aria-labelledby={`folio-${group.id}`}
						>
							<a className="folio-head" href={`/departments/${group.slug}`}>
								<span className="folio-code" id={`folio-${group.id}`}>
									{group.code}
								</span>
								<span className="folio-meta">
									<em>{group.name}</em>
									<b>{group.books.length}</b>
								</span>
							</a>
							<div className="folio-fan" aria-hidden="true">
								{group.books.map((book, i) => (
									<div
										key={book.id}
										className="fan-item"
										style={{ ['--tilt' as string]: `${tilts[i % tilts.length]}deg` }}
									>
										<PrintJacket
											book={book}
											linked={false}
											size="thumb"
											className="hover:!transform-none"
										/>
									</div>
								))}
							</div>
							<div className="slips">
								{group.books.map((book) => (
									<CatalogSlip key={book.id} book={book} />
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</>
	);
}
