export function deskTitle(pathname: string) {
	if (pathname === '/') return 'Objavovať';
	if (pathname.startsWith('/knihy')) return 'Katalóg';
	if (pathname.startsWith('/odbory')) return 'Odbory';
	if (pathname.startsWith('/autori')) return 'Autori';
	if (pathname.startsWith('/vypozicky')) return 'Moja knižnica';
	if (pathname.startsWith('/prihlasenie')) return 'Účet';
	return 'Knižnica';
}
