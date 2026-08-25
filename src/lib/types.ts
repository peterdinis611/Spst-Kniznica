import type { Role } from './ability';

export type SignedReader = {
	id: string;
	name: string;
	email: string;
	role: Role;
};

export type Reader = SignedReader | null;

export type CategoryRecord = {
	id: string;
	name: string;
	slug: string;
	description: string;
	code: string;
	accent: string;
	bookCount: number;
};

export type CategoryChip = {
	id: string;
	name: string;
	slug: string;
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

export type AuthorSlip = {
	id: string;
	name: string;
	slug: string;
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
	coverUrl: string | null;
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
		position: number;
	}[];
};

export type BookSlip = {
	id: string;
	title: string;
	callNumber: string;
	copiesTotal: number;
	copiesAvailable: number;
	coverUrl: string | null;
	category: CatalogBook['category'];
	authors: CatalogBook['authors'];
};

export type LoanRecord = {
	id: string;
	borrowedAt: Date;
	dueAt: Date;
	returnedAt: Date | null;
	borrowerFirstName: string;
	borrowerLastName: string;
	borrowerClass: string;
	loanDays: number;
	book: BookSlip;
};

export type BorrowerDraft = {
	firstName: string;
	lastName: string;
	className: string;
	days: number;
};
