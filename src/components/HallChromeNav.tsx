'use client';

import { useEffect, useState } from 'react';
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
				<a href="/" className="hall-logo no-underline" aria-label="SPŠT knižnica">
					<BookOpen className="size-6" />
				</a>
				<nav className="hall-desk-links" aria-label="Hlavná navigácia">
					<a href="/" aria-current={path === '/' ? 'page' : undefined}>
						Fond
					</a>
					<a href="/discover" aria-current={path.startsWith('/discover') ? 'page' : undefined}>
						Objavovať
					</a>
					<a href="/holdings" aria-current={path.startsWith('/holdings') ? 'page' : undefined}>
						Všetky knihy
					</a>
					<a href="/books">Katalóg</a>
					<a href="/authors">Autori</a>
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
					<a
						className="hall-login no-underline"
						href={user ? '/loans' : '/login'}
						aria-label={user ? 'Moje knihy' : 'Prihlásiť sa'}
					>
						<User className="size-4" />
						<span>{user ? 'Moje knihy' : 'Prihlásiť sa'}</span>
					</a>
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
					<a href="/" onClick={closeMenu}>
						Fond
					</a>
					<a href="/discover" onClick={closeMenu}>
						Objavovať
					</a>
					<a href="/holdings" onClick={closeMenu}>
						Všetky knihy
					</a>
					<a href="/books" onClick={closeMenu}>
						Katalóg
					</a>
					<a href="/departments" onClick={closeMenu}>
						Odbory
					</a>
					<a href="/authors" onClick={closeMenu}>
						Autori
					</a>
					<a href="/#mapa" onClick={closeMenu}>
						Mapa
					</a>
					{user ? (
						<>
							<a href="/profile" onClick={closeMenu}>
								Môj profil
							</a>
							<a href="/loans" onClick={closeMenu}>
								Moje knihy
							</a>
							{admin ? (
								<a href="/admin" onClick={closeMenu}>
									Pult
								</a>
							) : null}
						</>
					) : (
						<a href="/login" onClick={closeMenu}>
							Prihlásiť sa
						</a>
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
