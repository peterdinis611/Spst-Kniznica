'use client';

import { type ReactNode, useState } from 'react';
import { FolioLink as Link } from '@/components/FolioLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { docsHref } from '@/docs/href';

export type HandbookChapter = {
	url: string;
	title: string;
};

export function Handbook({
	chapters,
	currentUrl,
	children
}: {
	chapters: HandbookChapter[];
	currentUrl: string;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);

	function current(url: string) {
		return currentUrl === url || (url === '/docs' && currentUrl === '/docs/');
	}

	async function openTour() {
		const { startTour, markTourSeen } = await import('@/tour');
		await startTour(markTourSeen);
	}

	return (
		<div className="handbook" id="obsah">
			<header className="handbook-bind">
				<Link className="handbook-mark" href="/" data-tour="docs-mark">
					<span>SPŠT</span>
					knižnica
				</Link>
				<button
					type="button"
					className="handbook-toc-btn"
					onClick={() => setOpen((value) => !value)}
					aria-expanded={open}
				>
					Kapitoly
				</button>
				<div className="handbook-tools">
					<button
						type="button"
						className="handbook-tour-btn"
						onClick={openTour}
						aria-label="Prehliadka príručky"
					>
						Prehliadka
					</button>
					<Link className="handbook-cta" href="/discover" data-tour="docs-fund">
						Do fondu
					</Link>
					<ThemeToggle variant="hall" />
				</div>
			</header>

			<div className="handbook-spread">
				{open ? (
					<button
						type="button"
						className="handbook-scrim"
						aria-label="Zavrieť kapitoly"
						onClick={() => setOpen(false)}
					/>
				) : null}

				<aside className={`handbook-index${open ? ' is-open' : ''}`} data-tour="docs-chapters">
					<p className="handbook-spine" aria-hidden="true">
						<span>Príručka</span>
					</p>
					<div className="handbook-index-body">
						<p className="handbook-kicker">Kapitoly</p>
						<nav aria-label="Kapitoly príručky">
							{chapters.map((chapter, index) => (
								<Link
									key={chapter.url}
									className={`handbook-item${current(chapter.url) ? ' is-on' : ''}`}
									href={docsHref(chapter.url)}
									aria-current={current(chapter.url) ? 'page' : undefined}
									onClick={() => setOpen(false)}
								>
									<em>{String(index + 1).padStart(2, '0')}</em>
									<span>{chapter.title}</span>
								</Link>
							))}
						</nav>
					</div>
				</aside>

				<div className="handbook-paper">{children}</div>
			</div>
		</div>
	);
}
