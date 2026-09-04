import {
	Azeret_Mono,
	Bricolage_Grotesque,
	Cormorant_Garamond,
	Literata,
	Oswald
} from 'next/font/google';

export const fontDisplay = Cormorant_Garamond({
	subsets: ['latin', 'latin-ext'],
	weight: ['500', '600', '700'],
	style: ['normal', 'italic'],
	display: 'swap',
	variable: '--font-cormorant',
	preload: true,
	adjustFontFallback: true
});

export const fontBody = Literata({
	subsets: ['latin', 'latin-ext'],
	style: ['normal', 'italic'],
	display: 'swap',
	variable: '--font-literata',
	preload: true,
	adjustFontFallback: true
});

export const fontSans = Bricolage_Grotesque({
	subsets: ['latin', 'latin-ext'],
	display: 'swap',
	variable: '--font-bricolage',
	preload: false,
	adjustFontFallback: true
});

export const fontMono = Azeret_Mono({
	subsets: ['latin', 'latin-ext'],
	weight: ['500', '600'],
	display: 'swap',
	variable: '--font-azeret',
	preload: false
});

export const fontCondensed = Oswald({
	subsets: ['latin', 'latin-ext'],
	weight: ['500', '600', '700'],
	display: 'swap',
	variable: '--font-oswald',
	preload: false
});

export const fontVariables = [
	fontDisplay.variable,
	fontBody.variable,
	fontSans.variable,
	fontMono.variable,
	fontCondensed.variable
].join(' ');
