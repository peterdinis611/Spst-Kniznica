export type Reader = {
	id: string;
	name: string;
	email: string;
} | null;

export type CategoryRecord = {
	id: string;
	name: string;
	slug: string;
	description: string;
	code: string;
	accent: string;
	bookCount: number;
};

export type AuthorRecord = {
	id: string;
	name: string;
	slug: string;
	bio: string;
	lifespan: string;
	role: string;
	bookCount: number;
};

export type CatalogBook = {
	id: string;
	title: string;
	subtitle: string | null;
	year: number;
	pages: number;
	isbn: string;
	description: string;
	callNumber: string;
	copiesTotal: number;
	copiesAvailable: number;
	publisher: string;
	featured: boolean;
	category: {
		id: string;
		name: string;
		slug: string;
		code: string;
		accent: string;
	};
	authors: {
		id: string;
		name: string;
		slug: string;
	}[];
};

export type LoanRecord = {
	id: string;
	borrowedAt: Date;
	dueAt: Date;
	returnedAt: Date | null;
	book: CatalogBook;
};
