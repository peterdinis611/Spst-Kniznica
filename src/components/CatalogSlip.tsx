import Link from 'next/link';
import { authorLine, copiesLabel, copiesShort, splitCallNumber } from '@/utils/format';
import { clothFor } from '@/catalog/cover';
import type { BookSlip } from '@/types';
import './catalog-slip.css';

export function CatalogSlip({ book }: { book: BookSlip }) {
	const call = splitCallNumber(book.callNumber);
	const cloth = clothFor(book.id);
	const out = book.copiesAvailable === 0;

	return (
		<Link className="slip" href={`/books/${book.id}`} prefetch>
			<span className="slip-tab" style={{ background: cloth.bg }} />
			<span className="slip-call">
				<i>{call.dept}</i>
				<b>{call.number}</b>
				<em>{call.cutter}</em>
			</span>
			<span className="slip-body">
				<strong>{book.title}</strong>
				<span>{authorLine(book.authors)}</span>
			</span>
			<span className={`slip-mark${out ? ' is-out' : ''}`}>
				<abbr className="slip-short" title={copiesLabel(book.copiesAvailable, book.copiesTotal)}>
					{copiesShort(book.copiesAvailable, book.copiesTotal)}
				</abbr>
				<span className="slip-full">{copiesLabel(book.copiesAvailable, book.copiesTotal)}</span>
			</span>
		</Link>
	);
}
