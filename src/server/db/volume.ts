export type VolumeAuthor = {
	id: string;
	name: string;
	slug: string;
	lifespan: string;
	role: string;
	bio: string;
};

export type VolumeBook = {
	id: string;
	title: string;
	subtitle: string;
	year: number;
	pages: number;
	isbn: string;
	callNumber: string;
	categoryId: string;
	copiesTotal: number;
	copiesAvailable: number;
	publisher: string;
	featured: boolean;
	authorIds: string[];
	description: string;
};

const FIRST = [
	'Adam',
	'Alena',
	'Anna',
	'Barbora',
	'Dagmar',
	'Dominik',
	'Eva',
	'Filip',
	'Helena',
	'Igor',
	'Jana',
	'Jozef',
	'Ján',
	'Karol',
	'Kristína',
	'Lucia',
	'Lukáš',
	'Marcel',
	'Maria',
	'Martin',
	'Michal',
	'Miroslav',
	'Monika',
	'Norbert',
	'Ondrej',
	'Patrícia',
	'Pavol',
	'Peter',
	'Róbert',
	'Silvia',
	'Stanislav',
	'Tomáš',
	'Veronika',
	'Zuzana'
];

const LAST = [
	'Baláž',
	'Benko',
	'Csóka',
	'Dubček',
	'Farkaš',
	'Gajdoš',
	'Horváth',
	'Hruška',
	'Kováč',
	'Krajčí',
	'Kučera',
	'Lichner',
	'Majer',
	'Molnár',
	'Nagy',
	'Novák',
	'Oravec',
	'Polák',
	'Ružička',
	'Sedlák',
	'Szabó',
	'Šimko',
	'Tóth',
	'Urban',
	'Vajda',
	'Varga',
	'Zeman'
];

const TITLES: Record<string, [string, string]> = {
	'cat-inf': ['Mgr', 'informatik'],
	'cat-str': ['Ing', 'strojár'],
	'cat-ele': ['Ing', 'elektrotechnik'],
	'cat-mat': ['RNDr', 'matematik'],
	'cat-fyz': ['RNDr', 'fyzik'],
	'cat-lit': ['PhDr', 'literát'],
	'cat-his': ['PhDr', 'historik'],
	'cat-jaz': ['PaedDr', 'lektor']
};

const WORKS: Record<string, { titles: string[]; numbers: string[]; pubs: string[] }> = {
	'cat-inf': {
		titles: [
			'Algoritmy a dátové štruktúry',
			'Programovanie v C',
			'Úvod do databáz',
			'Siete v školskom pavilóne',
			'Objektové programovanie',
			'Operačné systémy',
			'Webové aplikácie',
			'Kryptografia pre stredné školy'
		],
		numbers: ['004.4', '004.43', '004.6', '004.7', '004.42', '004.45'],
		pubs: ['Školský fond SPŠT', 'Technická tlač', 'Kabinet informatiky']
	},
	'cat-str': {
		titles: [
			'Technické kreslenie',
			'Časti strojov',
			'Náuka o materiáloch',
			'Strojírenské technológie',
			'Hydraulika a pneumatika',
			'CNC v dielni',
			'Normy a tolerancie'
		],
		numbers: ['744', '621.8', '620.1', '621.9', '621.22'],
		pubs: ['Dielenské vydanie', 'Školský fond SPŠT']
	},
	'cat-ele': {
		titles: [
			'Základy elektrotechniky',
			'Číslicová technika',
			'Merania v laboratóriu',
			'Silnoprúdové obvody',
			'Elektronické súčiastky',
			'Automatizácia'
		],
		numbers: ['621.3', '621.394', '621.317', '621.31'],
		pubs: ['Laboratórna tlač', 'Školský fond SPŠT']
	},
	'cat-mat': {
		titles: [
			'Matematika pre stredné školy',
			'Diferenciálny počet',
			'Zbierka úloh',
			'Geometria v priestore',
			'Pravdepodobnosť',
			'Lineárna algebra'
		],
		numbers: ['51', '517', '514', '519.2'],
		pubs: ['Školský fond SPŠT', 'Technická tlač']
	},
	'cat-fyz': {
		titles: [
			'Fyzika v príkladoch',
			'Mechanika',
			'Elektrina a magnetizmus',
			'Optika',
			'Termika',
			'Laboratórne protokoly'
		],
		numbers: ['53', '531.2', '537', '535', '536'],
		pubs: ['Laboratórna tlač', 'Školský fond SPŠT']
	},
	'cat-lit': {
		titles: [
			'Náuka o slohu',
			'Povinné čítanie',
			'Rozbory textov',
			'Slovenská próza',
			'Básnická zbierka',
			'Teória literatúry'
		],
		numbers: ['808', '821.162', '82.0'],
		pubs: ['Školský fond SPŠT', 'Básnická knižnica']
	},
	'cat-his': {
		titles: [
			'Dejiny techniky',
			'Slovensko v 20. storočí',
			'Priemyselná revolúcia',
			'Školstvo na Slovensku',
			'Občianska náuka'
		],
		numbers: ['62(09)', '943.73', '94', '37(09)'],
		pubs: ['Technická tlač', 'Školský fond SPŠT']
	},
	'cat-jaz': {
		titles: [
			'Technical English',
			'Nemčina pre technikov',
			'Odborná slovná zásoba',
			'Lab reports in English',
			'Konverzácia v dielni'
		],
		numbers: ['811.111', '811.112', '81'],
		pubs: ['Workshop Press', 'Werkstatt Verlag', 'Školský fond SPŠT']
	}
};

const CATEGORY_IDS = Object.keys(WORKS);
const CANONICAL_AUTHORS = [
	'auth-belko',
	'auth-kovacova',
	'auth-vajda',
	'auth-tothova',
	'auth-hruska',
	'auth-lichner',
	'auth-stur',
	'auth-rufus',
	'auth-hronsky',
	'auth-kral',
	'auth-green',
	'auth-weber'
];

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(rand: () => number, list: T[]) {
	return list[Math.floor(rand() * list.length)] ?? list[0];
}

function fold(value: string) {
	return value
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function cutter(name: string) {
	const last = name.split(/\s+/).at(-1) ?? name;
	return fold(last).replace(/-/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
}

function isbnFor(index: number) {
	const body = `97880124${String(index).padStart(5, '0')}`;
	return `${body.slice(0, 3)}-${body.slice(3, 5)}-${body.slice(5, 8)}-${body.slice(8, 12)}-${body.slice(12)}`;
}

export function authorVolume(count: number): VolumeAuthor[] {
	const rand = mulberry32(0x5e1d);
	const people: VolumeAuthor[] = [];

	for (let i = 1; i <= count; i += 1) {
		const first = pick(rand, FIRST);
		const last = pick(rand, LAST);
		const categoryId = pick(rand, CATEGORY_IDS);
		const [title, role] = TITLES[categoryId] ?? ['Mgr', 'autor'];
		const born = 1946 + Math.floor(rand() * 40);
		const living = rand() > 0.18;
		const id = `auth-vol-${String(i).padStart(4, '0')}`;

		people.push({
			id,
			name: `${title}. ${first} ${last}`,
			slug: `${fold(first)}-${fold(last)}-${String(i).padStart(4, '0')}`,
			lifespan: living ? `${born} —` : `${born} — ${born + 48 + Math.floor(rand() * 20)}`,
			role,
			bio: `Autorský zväzok školského fondu. ${last} píše pre pavilón B — karty sú ošúchané, signatúra drží.`
		});
	}

	return people;
}

export function bookVolume(count: number, extraAuthors: VolumeAuthor[]): VolumeBook[] {
	const rand = mulberry32(0x60d);
	const authorPool = [...CANONICAL_AUTHORS, ...extraAuthors.map((person) => person.id)];
	const items: VolumeBook[] = [];

	for (let i = 1; i <= count; i += 1) {
		const categoryId = CATEGORY_IDS[(i - 1) % CATEGORY_IDS.length] ?? 'cat-inf';
		const work = WORKS[categoryId];
		const title = pick(rand, work.titles);
		const year = 1998 + Math.floor(rand() * 28);
		const copies = 2 + Math.floor(rand() * 9);
		const out = rand() < 0.08;
		const authorId = pick(rand, authorPool);
		const second = rand() < 0.18 ? pick(rand, authorPool) : null;
		const authorIds = second && second !== authorId ? [authorId, second] : [authorId];
		const number = pick(rand, work.numbers);
		const authorName =
			extraAuthors.find((person) => person.id === authorId)?.name ?? authorId.replace(/^auth-/, '');

		items.push({
			id: `book-vol-${String(i).padStart(4, '0')}`,
			title: `${title} ${i}`,
			subtitle: `Zošit školského fondu · rad ${year}`,
			year,
			pages: 96 + Math.floor(rand() * 360),
			isbn: isbnFor(i),
			callNumber: `${categoryId.slice(4).toUpperCase()} ${number} ${cutter(authorName)}`,
			categoryId,
			copiesTotal: copies,
			copiesAvailable: out ? 0 : copies,
			publisher: pick(rand, work.pubs),
			featured: false,
			authorIds,
			description:
				'Generovaný zväzok na záťažový register. Signatúra, autor a voľné výtlačky sedia v tom istom lístku ako živý fond.'
		});
	}

	return items;
}

export function seedTarget(raw: string | undefined, canonicalBooks: number) {
	if (!raw?.trim()) return canonicalBooks;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return canonicalBooks;
	return Math.min(Math.max(Math.floor(parsed), canonicalBooks), 20_000);
}
