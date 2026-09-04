'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, User } from 'lucide-react';
import type { CatalogSearchItem } from '@/catalog/search';
import type { Reader } from '@/types';
import { CatalogSearch } from './CatalogSearch';
import { ThemeToggle } from './ThemeToggle';

export function HallChromeNav({
	user,
	admin = false,
	path,
	searchPreview
}: {
	user: Reader;
	admin?: boolean;
	path: string;
	searchPreview: CatalogSearchItem[];
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setMenuOpen(false);
				setSearchOpen(true);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	function closeMenu() {
		setMenuOpen(false);
	}

	function openSearch() {
		setMenuOpen(false);
		setSearchOpen(true);
	}

	return (
		<>
			<header className="hall-nav">
				<Link href="/" className="hall-logo no-underline" aria-label="SPŠT knižnica">
					<BookOpen className="size-6" />
				</Link>
				<nav className="hall-desk-links" aria-label="Hlavná navigácia">
					<Link href="/" aria-current={path === '/' ? 'page' : undefined} prefetch>
						Fond
					</Link>
					<Link
						href="/discover"
						aria-current={path.startsWith('/discover') ? 'page' : undefined}
						prefetch
					>
						Objavovať
					</Link>
					<Link
						href="/holdings"
						aria-current={path.startsWith('/holdings') ? 'page' : undefined}
						prefetch
					>
						Všetky knihy
					</Link>
					<Link href="/books" prefetch>
						Katalóg
					</Link>
					<Link href="/authors" prefetch>
						Autori
					</Link>
				</nav>
				<div className="hall-tools">
					<button
						type="button"
						className="hall-search-btn"
						onClick={openSearch}
						aria-label="Hľadať knihu"
					>
						<Search className="size-4" />
						<span>Hľadať</span>
						<kbd>⌘K</kbd>
					</button>
					<ThemeToggle variant="hall" />
					<Link
						className="hall-login no-underline"
						href={user ? '/loans' : '/login'}
						aria-label={user ? 'Moje knihy' : 'Prihlásiť sa'}
					>
						<User className="size-4" />
						<span>{user ? 'Moje knihy' : 'Prihlásiť sa'}</span>
					</Link>
					<button
						type="button"
						className={`hall-menu-btn${menuOpen ? ' is-open' : ''}`}
						aria-controls="landing-menu"
						aria-expanded={menuOpen}
						aria-label={menuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<span />
						<span />
						<span />
					</button>
				</div>
			</header>

			{menuOpen ? (
				<nav className="hall-drawer" id="landing-menu" aria-label="Mobilné menu">
					<Link href="/" onClick={closeMenu}>
						Fond
					</Link>
					<Link href="/discover" onClick={closeMenu}>
						Objavovať
					</Link>
					<Link href="/holdings" onClick={closeMenu}>
						Všetky knihy
					</Link>
					<Link href="/books" onClick={closeMenu}>
						Katalóg
					</Link>
					<Link href="/departments" onClick={closeMenu}>
						Odbory
					</Link>
					<Link href="/authors" onClick={closeMenu}>
						Autori
					</Link>
					<Link href="/#mapa" onClick={closeMenu}>
						Mapa
					</Link>
					{user ? (
						<>
							<Link href="/profile" onClick={closeMenu}>
								Môj profil
							</Link>
							<Link href="/loans" onClick={closeMenu}>
								Moje knihy
							</Link>
							{admin ? (
								<Link href="/admin" onClick={closeMenu}>
									Pult
								</Link>
							) : null}
						</>
					) : (
						<Link href="/login" onClick={closeMenu}>
							Prihlásiť sa
						</Link>
					)}
					<div className="hall-drawer-tools">
						<ThemeToggle variant="hall" />
						<button type="button" className="hall-search-btn is-mobile" onClick={openSearch}>
							<Search className="size-4" />
							<span>Hľadať knihu</span>
						</button>
					</div>
				</nav>
			) : null}

			<CatalogSearch preview={searchPreview} open={searchOpen} onOpenChange={setSearchOpen} />
		</>
	);
}
