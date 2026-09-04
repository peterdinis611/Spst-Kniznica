'use client';

import type { BookSlip } from '@/types';
import { CatalogSlip } from './CatalogSlip';
import { VirtualWindow } from './VirtualWindow';

export function BookRegister({ books }: { books: BookSlip[] }) {
	if (books.length <= 48) {
		return (
			<div className="mt-8 grid gap-2">
				{books.map((book) => (
					<CatalogSlip key={book.id} book={book} />
				))}
			</div>
		);
	}

	return (
		<div className="mt-8">
			<VirtualWindow count={books.length} estimateSize={() => 88}>
				{(index) => {
					const book = books[index];
					return book ? <CatalogSlip book={book} /> : null;
				}}
			</VirtualWindow>
		</div>
	);
}
