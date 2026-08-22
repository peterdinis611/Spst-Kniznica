export function catalogDate(date = new Date()) {
	return new Intl.DateTimeFormat('sk-SK', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date);
}

export function shortDate(date: Date | string | number) {
	return new Intl.DateTimeFormat('sk-SK', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date(date));
}

export function stampDate(date: Date | string | number) {
	return new Intl.DateTimeFormat('sk-SK', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(date));
}

export function authorLine(authors: { name: string }[]) {
	if (authors.length === 0) return 'Neznámy autor';
	if (authors.length === 1) return authors[0].name;
	if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;
	return `${authors[0].name} a kol.`;
}

export function copiesLabel(available: number, total: number) {
	if (available === 0) return 'Nedostupné';
	if (available === 1) return `1 voľný z ${total}`;
	if (available < 5) return `${available} voľné z ${total}`;
	return `${available} voľných z ${total}`;
}

export function readerNumber(id: string) {
	return id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
}

export function firstName(name: string) {
	return name.trim().split(/\s+/)[0] ?? name;
}

export function daysUntil(date: Date | string | number) {
	const due = new Date(date);
	due.setHours(23, 59, 59, 999);
	return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function dueStatus(date: Date | string | number) {
	const days = daysUntil(date);
	if (days < 0) {
		const late = Math.abs(days);
		return {
			tone: 'late' as const,
			label: late === 1 ? '1 deň po lehote' : `${late} dni po lehote`
		};
	}
	if (days === 0) return { tone: 'soon' as const, label: 'Vrátiť dnes' };
	if (days === 1) return { tone: 'soon' as const, label: 'Zajtra splatné' };
	if (days <= 3) return { tone: 'soon' as const, label: `Ešte ${days} dni` };
	return { tone: 'ok' as const, label: `Do ${shortDate(date)}` };
}
