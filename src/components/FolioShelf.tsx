'use client';

import { useState } from 'react';
import './folio-shelf.css';

type ShelfBook = { id: string; title: string };

const palette = [
	'#d4a24a',
	'#7d96a8',
	'#c56a4a',
	'#8fa37a',
	'#e8d3b0',
	'#5c3d2e',
	'#b08968',
	'#4f6d7a',
	'#9a7b4f',
	'#c9896a'
];

const layout = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	[10, 11, 12, 13, 14, 15, 16, 17, 18],
	[19, 20, 21, 22, 23, 24, 25, 26]
];
const perBay = 27;
const bays = [0, 1, 2];
const tipIndexes = [2, 14, 27, 41, 58];
const widths = [
	0.78, 0.58, 0.7, 0.5, 0.82, 0.56, 0.66, 0.6, 0.74, 0.52, 0.8, 0.64, 0.7, 0.54, 0.76, 0.62, 0.72,
	0.58, 0.84, 0.5, 0.68, 0.6
];
const heights = [
	3.4, 4.1, 3.6, 4.6, 3.3, 4.2, 3.8, 4.4, 3.5, 4.5, 3.2, 4.0, 3.9, 4.3, 3.6, 4.15, 3.45, 4.55, 3.7,
	4.25, 3.85, 4.05
];

export function FolioShelf({ books }: { books: ShelfBook[] }) {
	const [active, setActive] = useState<string | null>(null);

	function bookAt(index: number) {
		if (books.length === 0) return null;
		return books[index % books.length];
	}

	return (
		<div
			className="folio-shelf"
			role="group"
			aria-label="Police vo fonde"
			onMouseLeave={() => setActive(null)}
		>
			{bays.map((bay) => (
				<div key={bay} className="folio-bay" style={{ ['--delay' as string]: `${0.16 + bay * 0.08}s` }}>
					<div className="folio-rail" />
					<div className="folio-well">
						{layout.map((row, rowIndex) => (
							<div className="folio-row" key={rowIndex}>
								<div className="folio-books">
									{row.map((slot) => {
										const index = bay * perBay + slot;
										const book = bookAt(index);
										const isTip = tipIndexes.includes(index);
										if (!book) return null;
										return (
											<a
												key={`${bay}-${slot}`}
												className={`folio-spine no-underline${isTip ? ' is-tip' : ''}${active === book.id ? ' is-on' : ''}`}
												href={`/books/${book.id}`}
												style={
													{
														['--w' as string]: `${widths[index % widths.length]}rem`,
														['--h' as string]: `${heights[index % heights.length]}rem`,
														['--c' as string]: palette[index % palette.length]
													} as React.CSSProperties
												}
												title={book.title}
												onMouseEnter={() => setActive(book.id)}
												onFocus={() => setActive(book.id)}
											>
												<span className="folio-band" />
												<span className="sr-only">{book.title}</span>
											</a>
										);
									})}
								</div>
								<div className="folio-plank" />
							</div>
						))}
					</div>
					<div className="folio-rail" />
				</div>
			))}

			{tipIndexes.map((index, i) => {
				const book = bookAt(index);
				if (!book) return null;
				return (
					<a
						key={index}
						className={`folio-tip no-underline tip-${i}${active === book.id ? ' is-on' : ''}`}
						href={`/books/${book.id}`}
						onMouseEnter={() => setActive(book.id)}
						onFocus={() => setActive(book.id)}
					>
						{book.title}
					</a>
				);
			})}
		</div>
	);
}
