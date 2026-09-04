export const PULT_TABLES = [
	{ href: '/admin/scan', label: 'Čítačka', code: '00' },
	{ href: '/admin', label: 'Prehľad', code: '01', inspect: true },
	{ href: '/admin/departments', label: 'Odbory', code: '02', table: 'category' },
	{ href: '/admin/authors', label: 'Autori', code: '03', table: 'author' },
	{ href: '/admin/books', label: 'Knihy', code: '04', table: 'book' },
	{ href: '/admin/book-authors', label: 'Väzby', code: '05', table: 'book_author' },
	{ href: '/admin/holdings', label: 'Výtlačky', code: '06', table: 'holding' },
	{ href: '/admin/loans', label: 'Výpožičky', code: '07', table: 'loan', inspect: true },
	{ href: '/admin/reservations', label: 'Rezervácie', code: '08', table: 'reservation' },
	{ href: '/admin/readers', label: 'Čitatelia', code: '09', table: 'user' },
	{ href: '/admin/reports', label: 'Výkazy', code: '10' },
	{ href: '/admin/queue', label: 'Fronta', code: '11' }
] as const;

export function pultTablesFor(manage: boolean) {
	if (manage) return PULT_TABLES;
	return PULT_TABLES.filter((item) => 'inspect' in item && item.inspect);
}

export const HOLDING_STATUSES = [
	{ value: 'available', label: 'voľný' },
	{ value: 'loaned', label: 'vonku' },
	{ value: 'lost', label: 'stratený' },
	{ value: 'withdrawn', label: 'vyradený' }
] as const;

export const RESERVATION_STATUSES = [
	{ value: 'pending', label: 'čaká' },
	{ value: 'fulfilled', label: 'na pulte' },
	{ value: 'cancelled', label: 'zrušená' },
	{ value: 'expired', label: 'exspirovaná' }
] as const;

export const LIST_LIMIT = 500;

export function slugify(raw: string) {
	const slug = raw
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 72);

	return slug || 'zaznam';
}

export function toDatetimeLocal(value: Date | string | number | null | undefined) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function holdingLabel(status: string) {
	return HOLDING_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function reservationLabel(status: string) {
	return RESERVATION_STATUSES.find((item) => item.value === status)?.label ?? status;
}
