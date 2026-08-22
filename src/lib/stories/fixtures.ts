import type { CatalogBook } from '$lib/types';

export const sampleBook: CatalogBook = {
	id: 'book-algoritmy',
	title: 'Algoritmy v dielni',
	subtitle: 'Od vývojového diagramu po kód',
	year: 2019,
	pages: 284,
	isbn: '978-80-555-0001-1',
	description: 'Učebnica pre INF.',
	callNumber: 'INF 004.4 ALG',
	copiesTotal: 4,
	copiesAvailable: 2,
	publisher: 'SPŠT',
	featured: true,
	category: {
		id: 'cat-inf',
		name: 'Informatika',
		slug: 'informatika',
		code: 'INF',
		accent: '#2c4a3e'
	},
	authors: [{ id: 'auth-belko', name: 'Prof. Ján Belko', slug: 'jan-belko' }]
};

export const shelfBooks = [
	sampleBook,
	{ id: 'book-stroje', title: 'Časti strojov' },
	{ id: 'book-obvody', title: 'Číslicové obvody' },
	{ id: 'book-analyza', title: 'Maturitná analýza' },
	{ id: 'book-pole', title: 'Elektrické pole' },
	{ id: 'book-sloh', title: 'Sloh v dielni' },
	{ id: 'book-technika', title: 'Dejiny techniky' },
	{ id: 'book-anglictina', title: 'Technical English' }
];
