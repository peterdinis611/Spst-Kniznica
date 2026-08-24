export const PULT_TABLES = [
	{ href: '/admin', label: 'Prehľad', code: '01' },
	{ href: '/admin/odbory', label: 'Odbory', code: '02', table: 'category' },
	{ href: '/admin/autori', label: 'Autori', code: '03', table: 'author' },
	{ href: '/admin/knihy', label: 'Knihy', code: '04', table: 'book' },
	{ href: '/admin/vazby', label: 'Väzby', code: '05', table: 'book_author' },
	{ href: '/admin/vytlacky', label: 'Výtlačky', code: '06', table: 'holding' },
	{ href: '/admin/vypozicky', label: 'Výpožičky', code: '07', table: 'loan' },
	{ href: '/admin/rezervacie', label: 'Rezervácie', code: '08', table: 'reservation' },
	{ href: '/admin/citately', label: 'Čitatelia', code: '09', table: 'user' }
] as const;

export const HOLDING_STATUSES = [
	{ value: 'available', label: 'voľný' },
	{ value: 'loaned', label: 'vonku' },
	{ value: 'lost', label: 'stratený' },
	{ value: 'withdrawn', label: 'vyradený' }
] as const;

export const RESERVATION_STATUSES = [
	{ value: 'pending', label: 'čaká' },
	{ value: 'fulfilled', label: 'splnená' },
	{ value: 'cancelled', label: 'zrušená' },
	{ value: 'expired', label: 'exspirovaná' }
] as const;

export const LIST_LIMIT = 80;

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
