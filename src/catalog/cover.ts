import type { CatalogBook } from '@/types';

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
		photo:
			'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#243044',
		fg: '#f7f1e6',
		ink: '#d6b35c',
		photo:
			'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#1b3b36',
		fg: '#f4efe6',
		ink: '#e8c36a',
		photo:
			'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#3f2a22',
		fg: '#f7f1e6',
		ink: '#e07a5f',
		photo:
			'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#6b2d3c',
		fg: '#f7f1e6',
		ink: '#e8c36a',
		photo:
			'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#2c4a3e',
		fg: '#f4efe6',
		ink: '#f4efe6',
		photo:
			'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#1a1a1a',
		fg: '#f7f1e6',
		ink: '#f06543',
		photo:
			'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=640&h=960&q=80'
	},
	{
		bg: '#efe6d6',
		fg: '#1c1915',
		ink: '#1b3b36',
		photo:
			'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=640&h=960&q=80'
	}
];

function hash(value: string) {
	let h = 0;
	for (let i = 0; i < value.length; i += 1) {
		h = (h * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

export function jacketFor(book: Pick<CatalogBook, 'id' | 'title'> & { coverUrl?: string | null }) {
	const tone = jackets[hash(book.id + book.title) % jackets.length];
	const photo = book.coverUrl?.trim();
	return photo ? { ...tone, photo } : tone;
}

export function authorLast(name: string) {
	return name.trim().split(/\s+/).at(-1) ?? name;
}

const swatches = [
	'var(--swatch-1)',
	'var(--swatch-2)',
	'var(--swatch-3)',
	'var(--swatch-4)',
	'var(--swatch-5)'
] as const;

export function authorSwatch(id: string) {
	return swatches[hash(id) % swatches.length];
}

export type ClothTone = {
	bg: string;
	ink: string;
	band: string;
};

const cloths: ClothTone[] = [
	{ bg: '#3c2a21', ink: '#f6f0e6', band: '#d4a24a' },
	{ bg: '#c56a4a', ink: '#fff6ee', band: '#f3eadf' },
	{ bg: '#7d96a8', ink: '#f4f7f8', band: '#3c2a21' },
	{ bg: '#8fa37a', ink: '#243018', band: '#f6f0e6' },
	{ bg: '#d4a24a', ink: '#2a1c10', band: '#3c2a21' },
	{ bg: '#5c3d2e', ink: '#f6f0e6', band: '#c56a4a' },
	{ bg: '#e8d3b0', ink: '#3c2a21', band: '#c56a4a' },
	{ bg: '#4f6d7a', ink: '#f3eae0', band: '#d4a24a' }
];

export function clothFor(id: string) {
	return cloths[hash(id) % cloths.length];
}

const PRESETS = {
	rail: {
		width: 360,
		height: 456,
		sizes: '(max-width: 720px) 74vw, 218px',
		widths: [240, 360, 540]
	},
	tile: {
		width: 400,
		height: 600,
		sizes: '(max-width: 720px) 46vw, 280px',
		widths: [280, 400, 640]
	},
	thumb: { width: 96, height: 128, sizes: '72px', widths: [48, 96, 144] },
	hero: {
		width: 480,
		height: 720,
		sizes: '(max-width: 720px) 70vw, 240px',
		widths: [320, 480, 720]
	},
	search: { width: 80, height: 108, sizes: '40px', widths: [40, 80, 120] }
} as const;

export type ImagePreset = keyof typeof PRESETS;

export function imagePreset(name: ImagePreset) {
	return PRESETS[name];
}

export function photoUrl(src: string, width: number, height?: number, quality = 68) {
	try {
		const url = new URL(src);
		if (!url.hostname.includes('unsplash.com')) return src;
		url.searchParams.set('auto', 'format');
		url.searchParams.set('fit', 'crop');
		url.searchParams.set('w', String(width));
		if (height) url.searchParams.set('h', String(height));
		url.searchParams.set('q', String(quality));
		url.searchParams.set('fm', 'webp');
		return url.toString();
	} catch {
		return src;
	}
}

export function photoSrcSet(
	src: string,
	widths: readonly number[],
	aspect: { width: number; height: number }
) {
	return widths
		.map((width) => {
			const height = Math.round((width * aspect.height) / aspect.width);
			return `${photoUrl(src, width, height)} ${width}w`;
		})
		.join(', ');
}
