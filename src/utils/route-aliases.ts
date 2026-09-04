export const ROUTE_ALIASES = [
	['/vsetky-knihy', '/holdings'],
	['/knihy', '/books'],
	['/odbory', '/departments'],
	['/autori', '/authors'],
	['/vypozicky', '/loans'],
	['/preukaz', '/profile'],
	['/profil', '/profile'],
	['/prihlasenie', '/login'],
	['/registracia', '/login?mod=novy'],
	['/zabudnute-heslo', '/login/recovery'],
	['/nove-heslo', '/login/password'],
	['/login/obnova', '/login/recovery'],
	['/login/heslo', '/login/password'],
	['/odhlasenie', '/logout'],
	['/pult', '/admin'],
	['/admin/odbory', '/admin/departments'],
	['/admin/autori', '/admin/authors'],
	['/admin/knihy', '/admin/books'],
	['/admin/vazby', '/admin/book-authors'],
	['/admin/vytlacky', '/admin/holdings'],
	['/admin/vypozicky', '/admin/loans'],
	['/admin/rezervacie', '/admin/reservations'],
	['/admin/citately', '/admin/readers'],
	['/admin/vykazy', '/admin/reports'],
	['/admin/fronta', '/admin/queue']
] as const;

export function aliasTarget(pathname: string, search = '') {
	for (const [from, to] of ROUTE_ALIASES) {
		if (pathname === from || pathname.startsWith(`${from}/`)) {
			return to.includes('?') ? to : `${to}${pathname.slice(from.length)}${search}`;
		}
	}

	return null;
}
