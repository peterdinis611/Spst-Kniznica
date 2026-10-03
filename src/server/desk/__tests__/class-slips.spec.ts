import { describe, expect, it } from 'vitest';
import { canStampClass } from '../class-gate';
import type { SignedReader } from '@/types';

const teacher = {
	id: 't1',
	name: 'Eva Učiteľ',
	email: 'eva@spst.sk',
	role: 'teacher',
	className: 'II.A'
} as SignedReader;

const librarian = {
	id: 'l1',
	name: 'Anna',
	email: 'anna@spst.sk',
	role: 'librarian'
} as SignedReader;

describe('canStampClass', () => {
	it('lets a teacher stamp the class on the rail', () => {
		expect(canStampClass(teacher, 'II.A')).toBe(true);
		expect(canStampClass(teacher, 'iii.b')).toBe(true);
		expect(canStampClass({ ...teacher, className: '' }, 'III.B')).toBe(true);
		expect(canStampClass(teacher, '')).toBe(false);
	});

	it('lets a librarian stamp any class', () => {
		expect(canStampClass(librarian, 'IV.C')).toBe(true);
	});

	it('keeps a reader off the class stamp', () => {
		expect(canStampClass({ ...teacher, role: 'reader' }, 'II.A')).toBe(false);
		expect(canStampClass(null, 'II.A')).toBe(false);
	});
});
