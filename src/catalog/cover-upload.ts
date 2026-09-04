export const COVER_MAX_BYTES = 4 * 1024 * 1024;
export const COVER_MAX_LABEL = '4 MB';
export const COVER_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

const COVER_EXT = /\.(jpe?g|png|webp)$/i;

export type CoverFileSlip = {
	name?: string;
	type?: string;
	size?: number;
};

export function coverFileFault(file: CoverFileSlip) {
	const size = file.size ?? 0;
	if (size <= 0) return 'Snímka je prázdna.';
	if (size > COVER_MAX_BYTES) return `Snímka je väčšia ako ${COVER_MAX_LABEL}.`;

	const type = (file.type ?? '').toLowerCase();
	const named = COVER_EXT.test(file.name ?? '');
	const typed = COVER_TYPES.some((allowed) => type === allowed);
	if (typed || named) return null;
	if (type.startsWith('image/')) return 'Obálka musí byť JPEG, PNG alebo WebP.';
	return 'Obálka musí byť obrázok (JPEG, PNG alebo WebP).';
}

export function coverUploadFault(error: { code?: string; message?: string } | string) {
	const code = typeof error === 'string' ? '' : (error.code ?? '');
	const message = typeof error === 'string' ? error : (error.message ?? '');
	const blob = `${code} ${message}`;
	if (/TOO_LARGE|FileSizeMismatch|too large|limit for that type is 4MB/i.test(blob)) {
		return `Snímka je väčšia ako ${COVER_MAX_LABEL}.`;
	}
	if (/TOO_SMALL|empty/i.test(blob)) return 'Snímka je prázdna.';
	if (
		/InvalidFileType|FileType|not allowed|BAD_REQUEST/i.test(blob) &&
		/image|jpeg|png|webp|type/i.test(blob)
	) {
		return 'Obálka musí byť JPEG, PNG alebo WebP.';
	}
	return message.trim() || 'Obálka sa nenahrala.';
}
