import type { CatalogBook } from '$lib/types';

export type JacketTone = {
	bg: string;
	fg: string;
	ink: string;
	band: string;
	pattern: 'plain' | 'band' | 'rule' | 'stamp';
};

const jackets: JacketTone[] = [
	{ bg: '#1c1915', fg: '#f4efe6', ink: '#e07a5f', band: '#e07a5f', pattern: 'rule' },
	{ bg: '#f7f1e6', fg: '#1c1915', ink: '#1b3b36', band: '#1b3b36', pattern: 'band' },
	{ bg: '#1b3b36', fg: '#f4efe6', ink: '#e8c36a', band: '#e8c36a', pattern: 'stamp' },
	{ bg: '#3f2a22', fg: '#f7f1e6', ink: '#e07a5f', band: '#c4a574', pattern: 'plain' },
	{ bg: '#efe6d6', fg: '#1c1915', ink: '#8a2f1f', band: '#8a2f1f', pattern: 'rule' },
	{ bg: '#243044', fg: '#f4efe6', ink: '#d6b35c', band: '#d6b35c', pattern: 'band' },
	{ bg: '#6b2d3c', fg: '#f7f1e6', ink: '#e8c36a', band: '#f4efe6', pattern: 'stamp' },
	{ bg: '#2c4a3e', fg: '#f4efe6', ink: '#f4efe6', band: '#e07a5f', pattern: 'plain' }
];

function hash(value: string) {
	let h = 0;
	for (let i = 0; i < value.length; i += 1) {
		h = (h * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

export function jacketFor(book: Pick<CatalogBook, 'id' | 'title'>) {
	return jackets[hash(book.id + book.title) % jackets.length];
}

export function authorLast(name: string) {
	return name.trim().split(/\s+/).at(-1) ?? name;
}
