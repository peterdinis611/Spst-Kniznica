'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { jacketFor } from '@/catalog/cover';
import type { CatalogSearchItem } from '@/catalog/search';
import { OptimizedImage } from './OptimizedImage';
import './catalog-search.css';

export function CatalogSearch({
	preview,
	open,
	onOpenChange
}: {
	preview: CatalogSearchItem[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const [hits, setHits] = useState<CatalogSearchItem[]>([]);
	const inputEl = useRef<HTMLInputElement>(null);
	const results = query.trim() ? hits : preview;

	useEffect(() => {
		setActive(0);
	}, [query]);

	useEffect(() => {
		if (!open) return;
		setQuery('');
		setHits([]);
		setActive(0);
		const id = requestAnimationFrame(() => inputEl.current?.focus());
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			cancelAnimationFrame(id);
			document.body.style.overflow = original;
		};
	}, [open]);

	useEffect(() => {
		const q = query.trim();
		if (!open || !q) return;
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!response.ok) return;
				const payload = (await response.json()) as { items?: CatalogSearchItem[] };
				setHits(payload.items ?? []);
			} catch {
				if (!controller.signal.aborted) setHits([]);
			}
		}, 180);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, open]);

	useEffect(() => {
		function onWindowKeydown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				onOpenChange(!open);
			}
		}
		window.addEventListener('keydown', onWindowKeydown);
		return () => window.removeEventListener('keydown', onWindowKeydown);
	}, [open, onOpenChange]);

	if (!open) return null;

	function onDialogKeydown(event: React.KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onOpenChange(false);
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActive((n) => Math.min(n + 1, Math.max(results.length - 1, 0)));
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActive((n) => Math.max(n - 1, 0));
			return;
		}
		if (event.key === 'Enter' && results[active]) {
			event.preventDefault();
			window.location.assign(`/books/${results[active].id}`);
		}
	}

	return (
		<div className="search-layer" role="presentation">
			<button
				type="button"
				className="search-backdrop"
				aria-label="Zavrieť hľadanie"
				onClick={() => onOpenChange(false)}
			/>
			<div
				className="search-panel"
				role="dialog"
				aria-modal="true"
				aria-labelledby="catalog-search-title"
				tabIndex={-1}
				onKeyDown={onDialogKeydown}
			>
				<div className="search-head">
					<p id="catalog-search-title" className="search-kicker">
						Katalóg SPŠT
					</p>
					<button
						type="button"
						className="search-close"
						onClick={() => onOpenChange(false)}
						aria-label="Zavrieť"
					>
						<X className="size-4" />
					</button>
				</div>
				<label className="search-field">
					<Search className="size-5" />
					<input
						ref={inputEl}
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
						type="search"
						placeholder="Názov, autor, signatúra alebo ISBN…"
						autoComplete="off"
						spellCheck={false}
					/>
				</label>
				<p className="search-hint">{query.trim() ? `${results.length} zásahov` : 'Najnovšie vo fonde'}</p>
				<ul className="search-list">
					{results.length === 0 ? (
						<li>
							<div className="empty-shelf" aria-hidden="true">
								<span />
								<span />
								<span />
								<span />
								<em />
							</div>
							<p className="font-display mt-3 text-[1.15rem]">V fonde nič nesedí</p>
							<p>
								Pre „{query.trim()}“ sa nenašiel názov, autor ani signatúra.
							</p>
							<button
								type="button"
								className="mt-3 rounded-full border px-3 py-1 text-sm"
								onClick={() => {
									setQuery('');
									inputEl.current?.focus();
								}}
							>
								Vymazať hľadanie
							</button>
						</li>
					) : (
						results.map((book, i) => {
							const jacket = jacketFor(book);
							return (
								<li key={book.id}>
									<a
										className={`search-hit${i === active ? ' is-active' : ''}`}
										href={`/books/${book.id}`}
										onMouseEnter={() => setActive(i)}
									>
										<OptimizedImage
											src={jacket.photo}
											preset="search"
											fallbackLabel={book.title}
											fallbackBg={jacket.bg}
											fallbackFg={jacket.fg}
										/>
										<span className="search-hit-copy">
											<strong>{book.title}</strong>
											<em>
												{book.authors} · {book.callNumber}
											</em>
										</span>
										<span className={`search-hit-state${book.copiesAvailable === 0 ? ' is-out' : ''}`}>
											{book.copiesAvailable > 0 ? 'Voľná' : 'Vonku'}
										</span>
									</a>
								</li>
							);
						})
					)}
				</ul>
			</div>
		</div>
	);
}
