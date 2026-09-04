export function compactIsbn(raw: string) {
	return raw.replace(/[^0-9Xx]/gi, '').toUpperCase();
}

export function looksLikeIsbn(raw: string) {
	const digits = compactIsbn(raw);
	return digits.length === 10 || digits.length === 13;
}
