export function deskTitle(pathname: string) {
	if (pathname === '/') return 'Discover';
	if (pathname.startsWith('/knihy')) return 'Catalog';
	if (pathname.startsWith('/odbory')) return 'Category';
	if (pathname.startsWith('/autori')) return 'Favorite';
	if (pathname.startsWith('/vypozicky')) return 'My Library';
	if (pathname.startsWith('/prihlasenie')) return 'Account';
	return 'THE BOOKS';
}
