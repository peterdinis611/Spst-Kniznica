import type { CatalogBook, CategoryRecord, Reader } from '$lib/types';

export const sampleReader: Reader = {
	id: 'reader-1',
	name: 'Mária Kováčová',
	email: 'maria.kovacova@spst.sk',
	role: 'reader'
};

export const sampleLibrarian: Reader = {
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian'
};

export const categories: CategoryRecord[] = [
	{
		id: 'cat-inf',
		name: 'Informatika',
		slug: 'informatika',
		code: 'INF',
		accent: '#2c4a3e',
		description: 'Algoritmy, databázy, siete a programovanie.',
		bookCount: 6
	},
	{
		id: 'cat-str',
		name: 'Strojárstvo',
		slug: 'strojarstvo',
		code: 'STR',
		accent: '#3d4a5c',
		description: 'Technické kreslenie a časti strojov.',
		bookCount: 4
	},
	{
		id: 'cat-ele',
		name: 'Elektrotechnika',
		slug: 'elektrotechnika',
		code: 'ELE',
		accent: '#8a5a12',
		description: 'Obvody, merania, číslicová technika.',
		bookCount: 3
	},
	{
		id: 'cat-lit',
		name: 'Literatúra',
		slug: 'literatura',
		code: 'LIT',
		accent: '#6b2d3c',
		description: 'Povinné čítanie a sloh.',
		bookCount: 5
	}
];

function book(
	partial: Pick<CatalogBook, 'id' | 'title'> & Partial<CatalogBook> & { category?: CategoryRecord }
): CatalogBook {
	const category = partial.category ?? categories[0];
	return {
		subtitle: null,
		year: 2019,
		pages: 240,
		isbn: '978-80-555-0000-0',
		description: '',
		callNumber: `${category.code} 000`,
		copiesTotal: 3,
		copiesAvailable: 2,
		publisher: 'SPŠT',
		featured: false,
		coverUrl: null,
		authors: [{ id: 'auth-belko', name: 'Prof. Ján Belko', slug: 'jan-belko', position: 0 }],
		...partial,
		category: {
			id: category.id,
			name: category.name,
			slug: category.slug,
			code: category.code,
			accent: category.accent
		}
	};
}

export const sampleBook = book({
	id: 'book-algoritmy',
	title: 'Algoritmy v dielni',
	subtitle: 'Od vývojového diagramu po kód',
	callNumber: 'INF 004.4 ALG',
	featured: true
});

export const catalogBooks: CatalogBook[] = [
	sampleBook,
	book({
		id: 'book-stroje',
		title: 'Časti strojov',
		category: categories[1],
		authors: [{ id: 'auth-kovac', name: 'Ing. Eva Kováčová', slug: 'eva-kovacova', position: 0 }],
		copiesAvailable: 0
	}),
	book({
		id: 'book-obvody',
		title: 'Číslicové obvody',
		category: categories[2],
		authors: [{ id: 'auth-horvath', name: 'Mgr. Peter Horváth', slug: 'peter-horvath', position: 0 }]
	}),
	book({
		id: 'book-sloh',
		title: 'Sloh v dielni',
		category: categories[3],
		authors: [{ id: 'auth-nova', name: 'PhDr. Anna Nováková', slug: 'anna-novakova', position: 0 }]
	}),
	book({
		id: 'book-siete',
		title: 'Siete v pavilóne C',
		callNumber: 'INF 004.7 SIE'
	}),
	book({
		id: 'book-analyza',
		title: 'Maturitná analýza',
		category: categories[1]
	})
];

export const shelfBooks = catalogBooks.map((item) => ({ id: item.id, title: item.title }));

export const sampleBorrower = {
	firstName: 'Mária',
	lastName: 'Kováčová',
	className: 'III.A',
	days: 21
};

export const searchPreview = catalogBooks.slice(0, 4).map((item) => ({
	id: item.id,
	title: item.title,
	authors: item.authors.map((person) => person.name).join(' & '),
	callNumber: item.callNumber,
	category: item.category.name,
	isbn: item.isbn,
	copiesAvailable: item.copiesAvailable,
	coverUrl: item.coverUrl
}));
