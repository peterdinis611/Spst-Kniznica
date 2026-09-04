'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookSlip } from '@/types';
import { authorLine, copiesLabel } from '@/utils/format';
import { jacketFor } from '@/catalog/cover';
import { BookCover } from './BookCover';
import { OptimizedImage } from './OptimizedImage';
import './cover-rail.css';

export function CoverRail({ books }: { books: BookSlip[] }) {
	const [index, setIndex] = useState(0);
	const [plain, setPlain] = useState(false);
	const dragged = useRef(false);
	const skipClick = useRef(false);
	const originX = useRef(0);
	const total = books.length;
	const cursor = total > 0 ? ((index % total) + total) % total : 0;
	const current = books[cursor];

	useEffect(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => setPlain(motion.matches);
		sync();
		motion.addEventListener('change', sync);
		return () => motion.removeEventListener('change', sync);
	}, []);

	function shift(i: number) {
		if (total === 0) return 0;
		let delta = i - cursor;
		const half = Math.floor(total / 2);
		if (delta > half) delta -= total;
		if (delta < -half) delta += total;
		return delta;
	}

	function go(delta: number) {
		if (total === 0) return;
		setIndex((n) => (n + delta + total) % total);
	}

	if (books.length === 0) return null;
	if (plain) {
		return (
			<div className="cover-rail">
				{books.map((book) => (
					<BookCover key={book.id} book={book} size="rail" />
				))}
			</div>
		);
	}

	return (
		<div
			className="complete-shelf"
			role="region"
			aria-roledescription="carousel"
			aria-label="Pracovné zväzky vo fonde"
		>
			<div className="shelf-tools">
				{total > 1 ? (
					<button
						type="button"
						className="shelf-nudge"
						onClick={() => go(-1)}
						aria-label="Predošlý zväzok"
					>
						<ChevronLeft />
					</button>
				) : null}
				<p className="shelf-count">
					<span>{String(cursor + 1).padStart(2, '0')}</span>
					<i>/</i>
					{String(total).padStart(2, '0')}
				</p>
				{total > 1 ? (
					<button
						type="button"
						className="shelf-nudge"
						onClick={() => go(1)}
						aria-label="Ďalší zväzok"
					>
						<ChevronRight />
					</button>
				) : null}
			</div>
			<div
				className="shelf-stage"
				onPointerDown={(event) => {
					originX.current = event.clientX;
					dragged.current = false;
					skipClick.current = false;
					(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
				}}
				onPointerMove={(event) => {
					if (Math.abs(event.clientX - originX.current) > 10) dragged.current = true;
				}}
				onPointerUp={(event) => {
					const dx = event.clientX - originX.current;
					if (dx > 52) {
						skipClick.current = true;
						go(-1);
					} else if (dx < -52) {
						skipClick.current = true;
						go(1);
					}
				}}
				onKeyDown={(event) => {
					if (event.key === 'ArrowRight') {
						event.preventDefault();
						go(1);
					}
					if (event.key === 'ArrowLeft') {
						event.preventDefault();
						go(-1);
					}
				}}
				tabIndex={0}
			>
				<div className="shelf-ring">
					{books.map((book, i) => {
						const offset = shift(i);
						if (Math.abs(offset) > 4) return null;
						const tone = jacketFor(book);
						const on = i === cursor;
						return (
							<a
								key={book.id}
								className={`volume no-underline${on ? ' is-on' : ''}${book.copiesAvailable === 0 ? ' is-out' : ''}`}
								style={
									{
										['--shift' as string]: offset,
										['--spine' as string]: book.category.accent,
										['--jacket' as string]: tone.bg,
										zIndex: 12 - Math.abs(offset)
									} as React.CSSProperties
								}
								href={`/books/${book.id}`}
								aria-current={on ? 'true' : undefined}
								aria-label={`${book.title}, ${authorLine(book.authors)}`}
								onClick={(event) => {
									if (skipClick.current || dragged.current) {
										event.preventDefault();
										skipClick.current = false;
										dragged.current = false;
										return;
									}
									if (i !== cursor) {
										event.preventDefault();
										setIndex(i);
									}
								}}
							>
								<span className="volume-spine">
									<em>{book.category.code}</em>
								</span>
								<span className="volume-cover">
									<OptimizedImage
										src={tone.photo}
										preset="rail"
										eager={on}
										className="volume-photo"
										fallbackLabel={book.title}
										fallbackBg={tone.bg}
										fallbackFg={tone.fg}
									/>
									<span className="volume-shade" />
									{on ? <span className="volume-title">{book.title}</span> : null}
								</span>
								<span className="volume-pages" />
							</a>
						);
					})}
				</div>
				<div className="shelf-plank" />
				<div className="shelf-grain" />
			</div>
			{current ? (
				<div className="shelf-card" aria-live="polite">
					<p className="shelf-kicker">
						{current.category.name}
						<span>{current.callNumber}</span>
					</p>
					<h3>{current.title}</h3>
					<p className="shelf-by">{authorLine(current.authors)}</p>
					<div className="shelf-meta">
						<b className={current.copiesAvailable === 0 ? 'is-out' : undefined}>
							{current.copiesAvailable > 0
								? copiesLabel(current.copiesAvailable, current.copiesTotal)
								: 'Práve vypožičaná'}
						</b>
						<a className="shelf-open no-underline" href={`/books/${current.id}`}>
							Otvoriť zväzok
						</a>
					</div>
				</div>
			) : null}
		</div>
	);
}
