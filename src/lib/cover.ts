import type { CatalogBook } from '$lib/types';

export type JacketTone = {
	bg: string;
	fg: string;
	ink: string;
	photo: string;
};

const jackets: JacketTone[] = [
	{
		bg: '#1c1915',
		fg: '#f7f1e6',
		ink: '#e07a5f',
		photo: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#243044',
		fg: '#f7f1e6',
		ink: '#d6b35c',
		photo: 'https://images.unsplash.com/photo-1512820790803-83ca734e04e8?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#1b3b36',
		fg: '#f4efe6',
		ink: '#e8c36a',
		photo: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#3f2a22',
		fg: '#f7f1e6',
		ink: '#e07a5f',
		photo: 'https://images.unsplash.com/photo-1495446817608-6a049dd6b0c3?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#6b2d3c',
		fg: '#f7f1e6',
		ink: '#e8c36a',
		photo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#2c4a3e',
		fg: '#f4efe6',
		ink: '#f4efe6',
		photo: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#1a1a1a',
		fg: '#f7f1e6',
		ink: '#f06543',
		photo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#efe6d6',
		fg: '#1c1915',
		ink: '#1b3b36',
		photo: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=640&h=960&q=80'
	}
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

const swatches = ['#e31b6d', '#1c2230', '#c45c12', '#2a6b5a', '#3d4ea3'];

export function authorSwatch(id: string) {
	return swatches[hash(id) % swatches.length];
}
