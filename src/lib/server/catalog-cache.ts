import type { AuthorRecord, CatalogBook, CategoryRecord } from '$lib/types';

export type CatalogSnapshot = {
	books: CatalogBook[];
	byId: Map<string, CatalogBook>;
	categories: CategoryRecord[];
	authors: AuthorRecord[];
	stats: {
		books: number;
		authors: number;
		available: number;
	};
};

let snapshot: CatalogSnapshot | null = null;

export function getCatalogCache() {
	return snapshot;
}

export function setCatalogCache(next: CatalogSnapshot) {
	snapshot = next;
}

export function invalidateCatalogCache() {
	snapshot = null;
}

export function patchCachedCopies(bookId: string, copiesAvailable: number) {
	const current = snapshot;
	if (!current) return false;

	const item = current.byId.get(bookId);
	if (!item) {
		snapshot = null;
		return false;
	}

	item.copiesAvailable = copiesAvailable;
	current.stats.available = current.books.reduce((sum, book) => sum + book.copiesAvailable, 0);
	return true;
}
