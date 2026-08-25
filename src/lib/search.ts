export type CatalogSearchItem = {
	id: string;
	title: string;
	authors: string;
	callNumber: string;
	category: string;
	isbn: string;
	copiesAvailable: number;
	coverUrl: string | null;
};
