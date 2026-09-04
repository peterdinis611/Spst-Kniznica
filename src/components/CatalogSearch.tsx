'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { jacketFor } from '@/catalog/cover';
import type { CatalogSearchItem } from '@/catalog/search';
import { OptimizedImage } from './OptimizedImage';
import './catalog-search.css';

function hitLabel(count: number) {
	if (count === 1) return '1 zásah';
	if (count >= 2 && count <= 4) return `${count} zásahy`;
	return `${count} zásahov`;
}

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
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
	const inputEl = useRef<HTMLInputElement>(null);
	const activeEl = useRef<HTMLAnchorElement>(null);
	const restoreEl = useRef<HTMLElement | null>(null);
	const listId = useId();
	const searching = query.trim().length > 0;
	const results = searching ? hits : preview;
	const loading = searching && status === 'loading';
	const empty = searching && status === 'ready' && hits.length === 0;
	const activeId = results[active] ? `${listId}-hit-${results[active].id}` : undefined;

	useEffect(() => {
		setActive(0);
		if (!query.trim()) {
			setHits([]);
			setStatus('idle');
		}
	}, [query]);

	useEffect(() => {
		if (!open) return;
		restoreEl.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		setQuery('');
		setHits([]);
		setActive(0);
		setStatus('idle');
		const id = requestAnimationFrame(() => inputEl.current?.focus());
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			cancelAnimationFrame(id);
			document.body.style.overflow = original;
			restoreEl.current?.focus();
		};
	}, [open]);

	useEffect(() => {
		const q = query.trim();
		if (!open || !q) return;
		const controller = new AbortController();
		setStatus('loading');
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!response.ok) {
					setHits([]);
					setStatus('ready');
					return;
				}
				const payload = (await response.json()) as { items?: CatalogSearchItem[] };
				setHits(payload.items ?? []);
				setStatus('ready');
			} catch {
				if (!controller.signal.aborted) {
					setHits([]);
					setStatus('ready');
				}
			}
		}, 180);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, open]);

	useEffect(() => {
		activeEl.current?.scrollIntoView({ block: 'nearest' });
	}, [active, results]);

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

	function close() {
		onOpenChange(false);
	}

	function onDialogKeydown(event: React.KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}
		if (empty || loading || results.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			setActive((n) => Math.min(n + 1, results.length - 1));
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setActive((n) => Math.max(n - 1, 0));
			return;
		}
		if (event.key === 'Home') {
			event.preventDefault();
			setActive(0);
			return;
		}
		if (event.key === 'End') {
			event.preventDefault();
			setActive(results.length - 1);
			return;
		}
		if (event.key === 'Enter' && results[active]) {
			event.preventDefault();
			window.location.assign(`/books/${results[active].id}`);
		}
	}

	const hint = loading
		? 'Listujem fond…'
		: searching
			? hitLabel(results.length)
			: 'Najnovšie vo fonde';

	return (
		<div className="search-layer" role="presentation" data-catalog-search="open">
			<button
				type="button"
				className="search-backdrop"
				aria-label="Zavrieť hľadanie"
				onClick={close}
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
					<div className="search-brand">
						<p id="catalog-search-title" className="search-kicker">
							Katalóg SPŠT
						</p>
						<p className="search-sub">Listovací lístok fondu</p>
					</div>
					<div className="search-head-tools">
						<kbd className="search-kbd">esc</kbd>
						<button type="button" className="search-close" onClick={close} aria-label="Zavrieť">
							<X className="size-4" />
						</button>
					</div>
				</div>
				<div className="search-field">
					<Search className="search-field-icon" strokeWidth={1.75} />
					<input
						ref={inputEl}
						id="catalog-search-input"
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
						type="search"
						placeholder="Názov, autor, signatúra alebo ISBN…"
						autoComplete="off"
						autoCorrect="off"
						spellCheck={false}
						enterKeyHint="search"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={true}
						aria-controls={listId}
						aria-activedescendant={activeId}
						aria-busy={loading}
					/>
					{query ? (
						<button
							type="button"
							className="search-clear"
							onClick={() => {
								setQuery('');
								inputEl.current?.focus();
							}}
							aria-label="Vymazať hľadanie"
						>
							<X className="size-3.5" />
						</button>
					) : null}
				</div>
				<div className="search-meta">
					<p className="search-hint">{hint}</p>
					{loading ? <span className="search-pulse" aria-hidden="true" /> : null}
				</div>
				<ul className="search-list" id={listId} role="listbox" aria-label="Výsledky katalógu">
					{loading ? (
						<li className="search-skel-wrap" aria-hidden="true">
							<span className="search-skel" />
							<span className="search-skel" />
							<span className="search-skel" />
						</li>
					) : empty ? (
						<li className="search-empty" role="presentation">
							<div className="empty-shelf" aria-hidden="true">
								<span />
								<span />
								<span />
								<span />
								<em />
							</div>
							<p className="search-empty-title">V fonde nič nesedí</p>
							<p className="search-empty-copy">
								Pre „{query.trim()}“ sa nenašiel názov, autor ani signatúra.
							</p>
							<button
								type="button"
								className="search-empty-clear"
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
							const selected = i === active;
							return (
								<li key={book.id} role="presentation">
									<a
										ref={selected ? activeEl : undefined}
										id={`${listId}-hit-${book.id}`}
										className={`search-hit${selected ? ' is-active' : ''}`}
										href={`/books/${book.id}`}
										role="option"
										aria-selected={selected}
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
											<em>{book.authors}</em>
											<b className="search-hit-call">{book.callNumber}</b>
										</span>
										<span
											className={`search-hit-state${book.copiesAvailable === 0 ? ' is-out' : ''}`}
										>
											{book.copiesAvailable > 0 ? 'Voľná' : 'Vonku'}
										</span>
									</a>
								</li>
							);
						})
					)}
				</ul>
				<p className="search-foot">
					<span>
						<kbd>↑</kbd>
						<kbd>↓</kbd> vybrať
					</span>
					<span>
						<kbd>↵</kbd> otvoriť
					</span>
					<span>
						<kbd>esc</kbd> zatvoriť
					</span>
				</p>
			</div>
		</div>
	);
}
