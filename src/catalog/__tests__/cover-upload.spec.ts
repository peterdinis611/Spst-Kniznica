import { describe, expect, it } from 'vitest';
import {
	COVER_MAX_BYTES,
	coverFileFault,
	coverUploadFault
} from '../cover-upload';

describe('coverFileFault', () => {
	it('blocks a file over 4 MB before it leaves the desk', () => {
		expect(
			coverFileFault({ name: 'obal.jpg', type: 'image/jpeg', size: COVER_MAX_BYTES + 1 })
		).toBe('Snímka je väčšia ako 4 MB.');
		expect(coverFileFault({ name: 'obal.jpg', type: 'image/jpeg', size: COVER_MAX_BYTES })).toBe(
			null
		);
	});

	it('blocks an empty slip and a wrong type', () => {
		expect(coverFileFault({ name: 'obal.jpg', type: 'image/jpeg', size: 0 })).toBe(
			'Snímka je prázdna.'
		);
		expect(coverFileFault({ name: 'obal.gif', type: 'image/gif', size: 1200 })).toBe(
			'Obálka musí byť JPEG, PNG alebo WebP.'
		);
		expect(coverFileFault({ name: 'obal.pdf', type: 'application/pdf', size: 1200 })).toBe(
			'Obálka musí byť obrázok (JPEG, PNG alebo WebP).'
		);
	});
});

describe('coverUploadFault', () => {
	it('turns UploadThing size errors into the desk stamp', () => {
		expect(
			coverUploadFault({
				code: 'TOO_LARGE',
				message: 'You uploaded a image file that was 5.12MB, but the limit for that type is 4MB'
			})
		).toBe('Snímka je väčšia ako 4 MB.');
		expect(coverUploadFault('FileSizeMismatchError')).toBe('Snímka je väčšia ako 4 MB.');
	});
});
