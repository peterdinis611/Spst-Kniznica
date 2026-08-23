import { count, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db, sqlite } from './index';
import { author, book, bookAuthor, category, holding } from './schema';
import { ensureCatalogFts, rebuildCatalogFts } from './catalog-fts';
import { authorVolume, bookVolume, seedTarget } from './volume';

const categories = [
	{
		id: 'cat-inf',
		name: 'Informatika',
		slug: 'informatika',
		code: 'INF',
		accent: '#2c4a3e',
		sortOrder: 1,
		description:
			'Algoritmy, databázy, siete a programovanie — fond pre študentov informačných technológií.'
	},
	{
		id: 'cat-str',
		name: 'Strojárstvo',
		slug: 'strojarstvo',
		code: 'STR',
		accent: '#3d4a5c',
		sortOrder: 2,
		description: 'Technické kreslenie, časti strojov a náuka o materiáloch z dielne pavilónu A.'
	},
	{
		id: 'cat-ele',
		name: 'Elektrotechnika',
		slug: 'elektrotechnika',
		code: 'ELE',
		accent: '#8a5a12',
		sortOrder: 3,
		description: 'Obvody, číslicová technika a merania. Výtlačky označené mosadzným hrebeňom.'
	},
	{
		id: 'cat-mat',
		name: 'Matematika',
		slug: 'matematika',
		code: 'MAT',
		accent: '#4a3a28',
		sortOrder: 4,
		description: 'Od stredoškolskej analýzy po zväzky, ktoré sa požičiavajú pred maturitou ako prvé.'
	},
	{
		id: 'cat-fyz',
		name: 'Fyzika',
		slug: 'fyzika',
		code: 'FYZ',
		accent: '#1e3a5f',
		sortOrder: 5,
		description: 'Mechanika, pole a príklady. Knižnica ich drží pri okne, lebo väzba znáša svetlo.'
	},
	{
		id: 'cat-lit',
		name: 'Literatúra',
		slug: 'literatura',
		code: 'LIT',
		accent: '#6b2d3c',
		sortOrder: 6,
		description: 'Povinné čítanie, sloh a poézia. Karty sú ošúchané od triednych výpožičiek.'
	},
	{
		id: 'cat-his',
		name: 'História',
		slug: 'historia',
		code: 'HIS',
		accent: '#3f4a32',
		sortOrder: 7,
		description: 'Dejiny techniky a Slovenska — zväzky, ktoré sa berú na referáty v piatok popoludní.'
	},
	{
		id: 'cat-jaz',
		name: 'Jazyky',
		slug: 'jazyky',
		code: 'JAZ',
		accent: '#4a5560',
		sortOrder: 8,
		description: 'Technická angličtina a nemčina pre dielňu, laboratórium aj maturitu.'
	}
];

const authors = [
	{
		id: 'auth-belko',
		name: 'Prof. Ján Belko',
		slug: 'jan-belko',
		lifespan: '1952 —',
		role: 'informatik',
		bio: 'Učil programovanie ešte na dierneštítkoch. Jeho učebnice sú v knižnici ošúchané po väzbu.'
	},
	{
		id: 'auth-kovacova',
		name: 'Doc. Mária Kováčová',
		slug: 'maria-kovacova',
		lifespan: '1968 —',
		role: 'informatička',
		bio: 'Databázy vysvetľuje ako kartotéku: každá relácia má svoje miesto a pečiatku.'
	},
	{
		id: 'auth-vajda',
		name: 'Ing. Karol Vajda',
		slug: 'karol-vajda',
		lifespan: '1949 —',
		role: 'strojár',
		bio: 'Bývalý majster dielne. Technické kreslenie kreslí ešte tušom, aj keď študenti prídu s CAD-om.'
	},
	{
		id: 'auth-tothova',
		name: 'Ing. Eva Tóthová',
		slug: 'eva-tothova',
		lifespan: '1975 —',
		role: 'elektrotechnička',
		bio: 'Autorka cvičení, v ktorých obvod vždy „nesedí“, kým si študent nenakreslí uzly.'
	},
	{
		id: 'auth-hruska',
		name: 'RNDr. Pavol Hruška',
		slug: 'pavol-hruska',
		lifespan: '1961 —',
		role: 'matematik',
		bio: 'Píše zbierky, v ktorých je posledná úloha vždy o čosi ťažšia, než sľubuje zadanie.'
	},
	{
		id: 'auth-lichner',
		name: 'Ing. Tomáš Lichner',
		slug: 'tomas-lichner',
		lifespan: '1980 —',
		role: 'fyzik',
		bio: 'Laboratórne protokoly má rád čisté. Knihy po ňom voňajú ceruzkou a liehom na sklo.'
	},
	{
		id: 'auth-stur',
		name: 'Ľudovít Štúr',
		slug: 'ludovit-stur',
		lifespan: '1815 — 1856',
		role: 'spisovateľ',
		bio: 'Jazykovedec a publicista. V školskom fonde stojí medzi slohom a povinným čítaním.'
	},
	{
		id: 'auth-rufus',
		name: 'Milan Rúfus',
		slug: 'milan-rufus',
		lifespan: '1928 — 2009',
		role: 'básnik',
		bio: 'Tichý hlas školskej knižnice. Modlitbičky sa požičiavajú v zime častejšie ako v júni.'
	},
	{
		id: 'auth-hronsky',
		name: 'Jozef Cíger Hronský',
		slug: 'jozef-ciger-hronsky',
		lifespan: '1896 — 1960',
		role: 'prozaik',
		bio: 'Autor, ktorého väzby sú v našom fonde najviac prelepené študentskými záložkami.'
	},
	{
		id: 'auth-kral',
		name: 'PhDr. Anna Králová',
		slug: 'anna-kralova',
		lifespan: '1971 —',
		role: 'historicka',
		bio: 'Píše dejiny techniky tak, že aj sústruh má biografiu. Referáty z nej chodia s citáciami.'
	},
	{
		id: 'auth-green',
		name: 'Helen Green',
		slug: 'helen-green',
		lifespan: '1964 —',
		role: 'lektorka',
		bio: 'Technická angličtina bez ozdôb: skrutka je bolt, kým nie je screw, a naopak.'
	},
	{
		id: 'auth-weber',
		name: 'Dr. Klaus Weber',
		slug: 'klaus-weber',
		lifespan: '1958 —',
		role: 'lektor',
		bio: 'Nemčina pre dielňu. Skloňuje náradie prísnejšie ako niektorí majstri žiakov.'
	}
];

const books = [
	{
		id: 'book-algoritmy',
		title: 'Základy algoritmizácie',
		subtitle: 'Od vývojového diagramu k prvému programu',
		year: 2019,
		pages: 284,
		isbn: '978-80-123-4501-1',
		callNumber: 'INF 004.4 BEL',
		categoryId: 'cat-inf',
		copiesTotal: 5,
		copiesAvailable: 5,
		publisher: 'Školský fond SPŠT',
		featured: true,
		authorIds: ['auth-belko'],
		description:
			'Učebnica, ktorá začína ceruzkou a papierom. Belko trvá na tom, že kým nevieš nakresliť slučku, nemáš písať kód. Výtlačky majú ošúchaný hrebeň a vpisky v okrajoch od troch ročníkov.'
	},
	{
		id: 'book-databazy',
		title: 'Databázové systémy',
		subtitle: 'Relácie, kľúče a kartotéka v stroji',
		year: 2021,
		pages: 336,
		isbn: '978-80-123-4502-8',
		callNumber: 'INF 004.6 KOV',
		categoryId: 'cat-inf',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Technická tlač',
		featured: false,
		authorIds: ['auth-kovacova'],
		description:
			'Kováčová učí databázy ako knižnicu: normalizácia je poriadok na polici, index je katalógová karta. Kapitola o JOIN-och je v našich výtlačkoch najzažltlejšia.'
	},
	{
		id: 'book-siete',
		title: 'Počítačové siete v škole',
		subtitle: 'Od krabice na chodbe po paket',
		year: 2020,
		pages: 248,
		isbn: '978-80-123-4503-5',
		callNumber: 'INF 004.7 BEL',
		categoryId: 'cat-inf',
		copiesTotal: 3,
		copiesAvailable: 3,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-belko', 'auth-kovacova'],
		description:
			'Spoločný zväzok o sieťach, ktoré bežia v pavilóne C. OSI model je tu nakreslený ako schodisko, nie ako veža. Praktické cvičenia vyžadujú kábel, nie len screenshot.'
	},
	{
		id: 'book-cpp',
		title: 'Úvod do C a C++',
		subtitle: 'Ukazovatele, pamäť a disciplína',
		year: 2018,
		pages: 412,
		isbn: '978-80-123-4504-2',
		callNumber: 'INF 004.43 BEL',
		categoryId: 'cat-inf',
		copiesTotal: 6,
		copiesAvailable: 6,
		publisher: 'Technická tlač',
		featured: false,
		authorIds: ['auth-belko'],
		description:
			'Hrubá väzba, tenký papier. Belko nenechá čitateľa ujsť od malloc-u. V knižnici evidujeme, že sa vracia s ohnutými rohmi práve na kapitole o poliach.'
	},
	{
		id: 'book-kreslenie',
		title: 'Technické kreslenie',
		subtitle: 'Pohľady, rezy a písmo na výkrese',
		year: 2016,
		pages: 198,
		isbn: '978-80-123-4601-8',
		callNumber: 'STR 744 VAJ',
		categoryId: 'cat-str',
		copiesTotal: 8,
		copiesAvailable: 8,
		publisher: 'Dielenské vydanie',
		featured: false,
		authorIds: ['auth-vajda'],
		description:
			'Formát A4 na šírku, ako výkres. Vajda kreslí ešte tušom a študentom zakazuje mazať gúmou — opravuje sa čiarou. Najpošpinenší zväzok v celom fonde.'
	},
	{
		id: 'book-casti',
		title: 'Časti strojov',
		subtitle: 'Spoje, ložiská, prevody',
		year: 2017,
		pages: 364,
		isbn: '978-80-123-4602-5',
		callNumber: 'STR 621.8 VAJ',
		categoryId: 'cat-str',
		copiesTotal: 5,
		copiesAvailable: 5,
		publisher: 'Dielenské vydanie',
		featured: false,
		authorIds: ['auth-vajda'],
		description:
			'Tabuľky, normy a rezy ozubených kolies. Kniha, ktorú si brávajú pred súťažou ZENIT aj pred opravou školského sústruhu. Na predsádke je pečiatka z roku 2017.'
	},
	{
		id: 'book-materialy',
		title: 'Materiály a ich spracovanie',
		subtitle: 'Od ocele po plast v školskej dielni',
		year: 2022,
		pages: 256,
		isbn: '978-80-123-4603-2',
		callNumber: 'STR 620.1 VAJ',
		categoryId: 'cat-str',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-vajda'],
		description:
			'Tepelné spracovanie vysvetlené tak, aby ho pochopil aj ten, kto ešte len drží pilník. Vzorky v laboratóriu sa k tejto knihe viažu lepiacou páskou na chrbte.'
	},
	{
		id: 'book-elektro',
		title: 'Základy elektrotechniky',
		subtitle: 'Ohm, Kirchhoff a merací protokol',
		year: 2019,
		pages: 302,
		isbn: '978-80-123-4701-5',
		callNumber: 'ELE 621.3 TOT',
		categoryId: 'cat-ele',
		copiesTotal: 6,
		copiesAvailable: 6,
		publisher: 'Laboratórna tlač',
		featured: false,
		authorIds: ['auth-tothova'],
		description:
			'Tóthová začína meraním, nie vzorcom. Každá kapitola končí protokolom, ktorý sa v laboratóriu odovzdáva s pečiatkou vyučujúceho. Naše výtlačky voňajú izopropylom.'
	},
	{
		id: 'book-cislicova',
		title: 'Číslicová technika',
		subtitle: 'Hradlá, registre, čítače',
		year: 2021,
		pages: 278,
		isbn: '978-80-123-4702-2',
		callNumber: 'ELE 621.394 TOT',
		categoryId: 'cat-ele',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Laboratórna tlač',
		featured: false,
		authorIds: ['auth-tothova', 'auth-belko'],
		description:
			'Od pravdivostnej tabuľky po jednoduchý procesor na cvičení. Spoločný jazyk elektrikárov a informatikov — v knižnici stojí na rozhraní dvoch políc.'
	},
	{
		id: 'book-mat1',
		title: 'Matematika pre stredné školy I',
		subtitle: 'Funkcie, rovnice, nerovnice',
		year: 2015,
		pages: 420,
		isbn: '978-80-123-4801-2',
		callNumber: 'MAT 51 HRU',
		categoryId: 'cat-mat',
		copiesTotal: 10,
		copiesAvailable: 10,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-hruska'],
		description:
			'Základný zväzok. Hruška čísluje príklady ako katalóg: 1.01 až 12.40. Pred písomkou mizne z police do hodiny. Väzba je spevnená izolepou na troch miestach.'
	},
	{
		id: 'book-analizy',
		title: 'Základy diferenciálneho počtu',
		subtitle: 'Limity, derivácie, aplikácie',
		year: 2020,
		pages: 268,
		isbn: '978-80-123-4802-9',
		callNumber: 'MAT 517 HRU',
		categoryId: 'cat-mat',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Technická tlač',
		featured: false,
		authorIds: ['auth-hruska'],
		description:
			'Hruška derivuje na šírku strany a necháva miesto na vlastný výpočet. Študenti do nej dopisujú, preto evidujeme výtlačky prísnejšie ako beletriu.'
	},
	{
		id: 'book-fyzika',
		title: 'Fyzika v príkladoch',
		subtitle: 'Mechanika, energia, kmitanie',
		year: 2018,
		pages: 312,
		isbn: '978-80-123-4901-9',
		callNumber: 'FYZ 53 LIC',
		categoryId: 'cat-fyz',
		copiesTotal: 7,
		copiesAvailable: 7,
		publisher: 'Laboratórna tlač',
		featured: false,
		authorIds: ['auth-lichner'],
		description:
			'Lichner počíta s ceruzkou 2H. Každý príklad má nákres, ktorý vyzerá ako z protokolu. Kniha leží v knižnici vedľa sady závaží — nie náhodou.'
	},
	{
		id: 'book-mechanika',
		title: 'Mechanika tuhého telesa',
		subtitle: 'Sily, momenty, ťažisko',
		year: 2023,
		pages: 224,
		isbn: '978-80-123-4902-6',
		callNumber: 'FYZ 531.2 LIC',
		categoryId: 'cat-fyz',
		copiesTotal: 3,
		copiesAvailable: 3,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-lichner', 'auth-vajda'],
		description:
			'Most medzi fyzikou a strojárstvom. Statika nakreslená tak, aby ju dielňa aj kabinet uznali. Novší zväzok, väzba ešte drží farbu.'
	},
	{
		id: 'book-sloh',
		title: 'Náuka o slohu',
		subtitle: 'Úvaha, výklad, charakteristika',
		year: 2014,
		pages: 176,
		isbn: '978-80-123-4101-3',
		callNumber: 'LIT 808 SLO',
		categoryId: 'cat-lit',
		copiesTotal: 12,
		copiesAvailable: 12,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-stur'],
		description:
			'Metodická príručka k slohu, viazaná v bordovej plátnovej väzbe. Štúrovo meno na chrbte je pocta, nie autorské právo — zostavovateľská edícia školského fondu.'
	},
	{
		id: 'book-modlitbicky',
		title: 'Modlitbičky',
		subtitle: null,
		year: 2000,
		pages: 96,
		isbn: '978-80-123-4102-0',
		callNumber: 'LIT 821.162 RUF',
		categoryId: 'cat-lit',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Básnická knižnica',
		featured: false,
		authorIds: ['auth-rufus'],
		description:
			'Tenký zväzok, ťažký hlas. Rúfus sa v našej knižnici nepožičiava na tri týždne v máji — vtedy ho berú na recitáciu. Väzba je šedá ako november.'
	},
	{
		id: 'book-jozef',
		title: 'Jozef Mak',
		subtitle: null,
		year: 1998,
		pages: 248,
		isbn: '978-80-123-4103-7',
		callNumber: 'LIT 821.162 HRO',
		categoryId: 'cat-lit',
		copiesTotal: 6,
		copiesAvailable: 6,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-hronsky'],
		description:
			'Povinné čítanie s najväčším počtom záložiek. Hronského veta sa v triedach číta nahlas a v knižnici sa vracia s ohnutým rohom na kapitole o Makovi.'
	},
	{
		id: 'book-technika-dejiny',
		title: 'Dejiny techniky',
		subtitle: 'Od kolesa po školský sústruh',
		year: 2020,
		pages: 288,
		isbn: '978-80-123-4201-0',
		callNumber: 'HIS 62(09) KRA',
		categoryId: 'cat-his',
		copiesTotal: 3,
		copiesAvailable: 3,
		publisher: 'Technická tlač',
		featured: false,
		authorIds: ['auth-kral'],
		description:
			'Králová píše o náradí ako o postavách. Kapitola o priemyselnej revolúcii je podčiarknutá v každom výtlačku inou farbou — podľa ročníka.'
	},
	{
		id: 'book-slovensko',
		title: 'Slovensko v 20. storočí',
		subtitle: 'Škola, dielňa, republika',
		year: 2019,
		pages: 340,
		isbn: '978-80-123-4202-7',
		callNumber: 'HIS 943.73 KRA',
		categoryId: 'cat-his',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Školský fond SPŠT',
		featured: false,
		authorIds: ['auth-kral'],
		description:
			'Dejiny, ktoré sa nekončia pri dátumoch. Králová vkladá do kapitol fotografické prílohy školských dielní. Vhodné na referát aj na tiché čítanie v študovni.'
	},
	{
		id: 'book-english',
		title: 'Technical English for the Workshop',
		subtitle: 'Bolts, circuits, and lab reports',
		year: 2021,
		pages: 192,
		isbn: '978-80-123-4301-7',
		callNumber: 'JAZ 811.111 GRE',
		categoryId: 'cat-jaz',
		copiesTotal: 5,
		copiesAvailable: 5,
		publisher: 'Workshop Press',
		featured: false,
		authorIds: ['auth-green'],
		description:
			'Slovník a cvičenia pre dielňu. Greenová učí, že drawing nie je vždy kresba a že protocol v laboratóriu nie je sieťová dohoda. Výtlačky majú anglickú pečiatku DUE.'
	},
	{
		id: 'book-nemcina',
		title: 'Nemčina pre technikov',
		subtitle: 'Werkstatt, Messung, Bericht',
		year: 2018,
		pages: 210,
		isbn: '978-80-123-4302-4',
		callNumber: 'JAZ 811.112 WEB',
		categoryId: 'cat-jaz',
		copiesTotal: 4,
		copiesAvailable: 4,
		publisher: 'Werkstatt Verlag',
		featured: false,
		authorIds: ['auth-weber'],
		description:
			'Weber skloňuje náradie a žiada slovosled aj v protokole. Kniha sa požičiava pred odbornou praxou a vracia sa s nemeckými vpiskami v okrajoch.'
	}
];

let seeded = false;

type CatalogRow = {
	authorIds: string[];
	id: string;
	title: string;
	subtitle: string | null;
	year: number;
	pages: number;
	isbn: string;
	callNumber: string;
	categoryId: string;
	copiesTotal: number;
	copiesAvailable: number;
	publisher: string;
	featured: boolean;
	description: string;
};

function chunk<T>(items: T[], size: number) {
	const batches: T[][] = [];
	for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
	return batches;
}

function categoryCode(categoryId: string) {
	return categories.find((item) => item.id === categoryId)?.code ?? 'FON';
}

function inventoryNo(code: string, bookId: string, index: number) {
	const token = bookId
		.replace(/^book-/, '')
		.replace(/[^a-z0-9]+/gi, '')
		.slice(0, 10)
		.toUpperCase();
	return `${code}-${token}-${String(index).padStart(2, '0')}`;
}

function holdingRows(catalog: CatalogRow[]) {
	return catalog.flatMap((item) => {
		const code = categoryCode(item.categoryId);
		return Array.from({ length: item.copiesTotal }, (_, i) => {
			const n = i + 1;
			return {
				id: `${item.id}-h${String(n).padStart(2, '0')}`,
				bookId: item.id,
				inventoryNo: inventoryNo(code, item.id, n),
				status: (n <= item.copiesAvailable ? 'available' : 'loaned') as 'available' | 'loaned'
			};
		});
	});
}

function insertCatalog(tx: { insert: typeof db.insert }, catalog: CatalogRow[]) {
	if (catalog.length === 0) return;
	for (const batch of chunk(catalog, 60)) {
		tx.insert(book)
			.values(
				batch.map(({ authorIds, ...rest }) => {
					void authorIds;
					return rest;
				})
			)
			.run();
		tx.insert(bookAuthor)
			.values(
				batch.flatMap((item) =>
					item.authorIds.map((authorId, position) => ({ bookId: item.id, authorId, position }))
				)
			)
			.run();
		const copies = holdingRows(batch);
		if (copies.length) tx.insert(holding).values(copies).run();
	}
}

function ensureHoldings() {
	const existing = db.select({ c: count() }).from(holding).get()?.c ?? 0;
	if (existing > 0) return;

	const rows = db
		.select({
			id: book.id,
			copiesTotal: book.copiesTotal,
			copiesAvailable: book.copiesAvailable,
			code: category.code
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.all();

	const copies = rows.flatMap((item) =>
		Array.from({ length: item.copiesTotal }, (_, i) => {
			const n = i + 1;
			return {
				id: `${item.id}-h${String(n).padStart(2, '0')}`,
				bookId: item.id,
				inventoryNo: inventoryNo(item.code, item.id, n),
				status: (n <= item.copiesAvailable ? 'available' : 'loaned') as 'available' | 'loaned'
			};
		})
	);

	for (const batch of chunk(copies, 200)) {
		db.insert(holding).values(batch).run();
	}
}

function ensureLoanGuards() {
	sqlite.exec(
		`CREATE UNIQUE INDEX IF NOT EXISTS loan_one_active_uidx ON loan(user_id, book_id) WHERE returned_at IS NULL`
	);
}

function ensureCategoryOrder() {
	for (const item of categories) {
		db.update(category).set({ sortOrder: item.sortOrder }).where(eq(category.id, item.id)).run();
	}
}

export function ensureSeeded() {
	if (seeded) return;

	let catalogChanged = false;
	const categoryCount = db.select({ c: count() }).from(category).get()?.c ?? 0;
	if (categoryCount === 0) {
		db.transaction((tx) => {
			tx.insert(category).values(categories).run();
			tx.insert(author).values(authors).run();
			insertCatalog(tx, books);
		});
		catalogChanged = true;
	}

	const target = seedTarget(env.SEED_VOLUME, books.length);
	const current = db.select({ c: count() }).from(book).get()?.c ?? 0;
	if (current < target) {
		const extraBooks = Math.max(0, target - books.length);
		const extraAuthors = authorVolume(Math.max(24, Math.ceil(extraBooks / 8)));
		const generated = bookVolume(extraBooks, extraAuthors);

		const haveAuthors = new Set(
			db
				.select({ id: author.id })
				.from(author)
				.all()
				.map((row) => row.id)
		);
		const haveBooks = new Set(
			db
				.select({ id: book.id })
				.from(book)
				.all()
				.map((row) => row.id)
		);

		const authorsToAdd = extraAuthors.filter((person) => !haveAuthors.has(person.id));
		const booksToAdd = generated.filter((item) => !haveBooks.has(item.id));
		if (authorsToAdd.length || booksToAdd.length) {
			const knownAuthors = new Set([...haveAuthors, ...authorsToAdd.map((person) => person.id)]);

			db.transaction((tx) => {
				for (const batch of chunk(authorsToAdd, 80)) {
					tx.insert(author).values(batch).run();
				}
				insertCatalog(
					tx,
					booksToAdd.map((item) => ({
						...item,
						authorIds: item.authorIds.filter((id) => knownAuthors.has(id))
					}))
				);
			});
			catalogChanged = true;
		}
	}

	ensureHoldings();
	ensureCategoryOrder();
	ensureCatalogFts();
	ensureLoanGuards();
	if (catalogChanged) rebuildCatalogFts();
	seeded = true;
}
