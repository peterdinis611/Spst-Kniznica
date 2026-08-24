export function deskTitle(pathname: string) {
	if (pathname.startsWith('/discover')) return 'Objavovať';
	if (pathname.startsWith('/holdings')) return 'Všetky knihy';
	if (pathname.startsWith('/books')) return 'Katalóg';
	if (pathname.startsWith('/departments')) return 'Odbory';
	if (pathname.startsWith('/authors')) return 'Autori';
	if (pathname.startsWith('/admin')) return 'Pult';
	if (pathname.startsWith('/loans')) return 'Moje knihy';
	if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return 'Účet';
	if (pathname.startsWith('/docs')) return 'Príručka';
	return 'SPŠT knižnica';
}
