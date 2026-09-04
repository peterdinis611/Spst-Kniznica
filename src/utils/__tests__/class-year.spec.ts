import { describe, expect, it } from 'vitest';
import { GRADUATE_CLASS, parseSchoolClass, shiftSchoolClass } from '../class-year';

describe('shiftSchoolClass', () => {
	it('promotes Roman years with a letter', () => {
		expect(shiftSchoolClass('I.A')).toEqual({ kind: 'promote', from: 'I.A', to: 'II.A' });
		expect(shiftSchoolClass(' ii.b ')).toEqual({ kind: 'promote', from: 'II.B', to: 'III.B' });
		expect(shiftSchoolClass('III.C')).toEqual({ kind: 'promote', from: 'III.C', to: 'IV.C' });
	});

	it('stamps the fourth year as graduates', () => {
		expect(shiftSchoolClass('IV.A')).toEqual({
			kind: 'graduate',
			from: 'IV.A',
			to: GRADUATE_CLASS
		});
	});

	it('leaves vocational groups and empty tokens alone', () => {
		expect(shiftSchoolClass('3.INF')).toEqual({ kind: 'skip', token: '3.INF' });
		expect(shiftSchoolClass(GRADUATE_CLASS)).toEqual({ kind: 'skip', token: GRADUATE_CLASS });
		expect(shiftSchoolClass('')).toEqual({ kind: 'skip', token: '' });
	});
});

describe('parseSchoolClass', () => {
	it('reads a normalized school class', () => {
		expect(parseSchoolClass('i.a')).toEqual({ year: 'I', letter: 'A', token: 'I.A' });
	});
});
