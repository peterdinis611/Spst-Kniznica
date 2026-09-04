'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookSlip } from '@/types';
import { cn } from '@/utils/cn';
import { PrintJacket } from './PrintJacket';
import './shelf-slider.css';

export function ShelfSlider({
	books,
	label,
	moreHref,
	moreLabel = 'Celá polica'
}: {
	books: BookSlip[];
	label: string;
	moreHref?: string;
	moreLabel?: string;
}) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(1);
	const [atStart, setAtStart] = useState(true);
	const [atEnd, setAtEnd] = useState(books.length <= 1);

	const measure = useCallback(() => {
		const track = trackRef.current;
		if (!track) return;
		const max = Math.max(0, track.scrollWidth - track.clientWidth);
		const left = track.scrollLeft;
		const cards = [...track.querySelectorAll<HTMLElement>('[data-shelf-card]')];
		let current = 1;
		for (let i = 0; i < cards.length; i += 1) {
			const card = cards[i];
			if (card.offsetLeft + card.offsetWidth * 0.45 >= left) {
				current = i + 1;
				break;
			}
		}
		setIndex(current);
		setAtStart(left <= 8);
		setAtEnd(max <= 12 || left >= max - 8);
	}, []);

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		measure();
		const frame = () => measure();
		track.addEventListener('scroll', frame, { passive: true });
		const observer = new ResizeObserver(frame);
		observer.observe(track);
		return () => {
			track.removeEventListener('scroll', frame);
			observer.disconnect();
		};
	}, [measure, books.length]);

	function step(dir: -1 | 1) {
		const track = trackRef.current;
		if (!track) return;
		const cards = track.querySelectorAll<HTMLElement>('[data-shelf-card]');
		const first = cards[0];
		const second = cards[1];
		const amount =
			first && second
				? second.offsetLeft - first.offsetLeft
				: first
					? first.getBoundingClientRect().width
					: track.clientWidth * 0.72;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		track.scrollBy({ left: dir * amount, behavior: motion ? 'auto' : 'smooth' });
	}

	if (books.length === 0) return null;

	return (
		<div className={cn('bay', atEnd && 'is-end')}>
			<div className="bay-tools">
				{books.length > 1 ? (
					<div className="bay-crank">
						<button
							type="button"
							className="bay-nudge"
							onClick={() => step(-1)}
							disabled={atStart}
							aria-label={`Predošlé zväzky, ${label}`}
						>
							<ChevronLeft />
						</button>
						<p className="bay-count" aria-live="polite">
							<b>{String(index).padStart(2, '0')}</b>
							<i>/</i>
							{String(books.length).padStart(2, '0')}
						</p>
						<button
							type="button"
							className="bay-nudge"
							onClick={() => step(1)}
							disabled={atEnd}
							aria-label={`Ďalšie zväzky, ${label}`}
						>
							<ChevronRight />
						</button>
					</div>
				) : null}
				{moreHref ? (
					<a className="bay-more" href={moreHref}>
						{moreLabel}
					</a>
				) : null}
			</div>
			<div
				ref={trackRef}
				className="bay-track"
				tabIndex={books.length > 1 ? 0 : undefined}
				role="region"
				aria-roledescription="carousel"
				aria-label={`Polica odboru ${label}`}
				onKeyDown={(event) => {
					if (event.key === 'ArrowLeft') {
						event.preventDefault();
						step(-1);
					}
					if (event.key === 'ArrowRight') {
						event.preventDefault();
						step(1);
					}
				}}
			>
				{books.map((book) => (
					<a key={book.id} className="bay-card" data-shelf-card href={`/books/${book.id}`}>
						<span className="sm:hidden">
							<PrintJacket book={book} linked={false} size="thumb" />
						</span>
						<span className="hidden sm:block">
							<PrintJacket book={book} linked={false} />
						</span>
					</a>
				))}
			</div>
		</div>
	);
}
