export function deskTitle(pathname: string) {
	if (pathname.startsWith('/discover')) return 'Objavovať';
	if (pathname.startsWith('/knihy')) return 'Katalóg';
	if (pathname.startsWith('/odbory')) return 'Odbory';
	if (pathname.startsWith('/autori')) return 'Autori';
	if (pathname.startsWith('/vypozicky')) return 'Moje knihy';
	if (pathname.startsWith('/prihlasenie')) return 'Účet';
	return 'SPŠT knižnica';
}
