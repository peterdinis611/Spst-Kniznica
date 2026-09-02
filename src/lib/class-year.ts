import { normalizeClass } from './borrow-fields';

export const GRADUATE_CLASS = 'ABSOLVENT';

const YEARS = ['I', 'II', 'III', 'IV'] as const;
export type SchoolYear = (typeof YEARS)[number];

const YEAR_SET = new Set<string>(YEARS);
const CLASS_RE = /^(I{1,3}|IV)\.([A-Z])$/;

export type ParsedSchoolClass = {
	year: SchoolYear;
	letter: string;
	token: string;
};

export type ClassShift =
	| { kind: 'skip'; token: string }
	| { kind: 'promote'; from: string; to: string }
	| { kind: 'graduate'; from: string; to: typeof GRADUATE_CLASS };

export function parseSchoolClass(raw: string): ParsedSchoolClass | null {
	const token = normalizeClass(raw);
	const match = token.match(CLASS_RE);
	if (!match) return null;
	const year = match[1];
	if (!YEAR_SET.has(year)) return null;
	return { year: year as SchoolYear, letter: match[2], token: `${year}.${match[2]}` };
}

export function shiftSchoolClass(raw: string): ClassShift {
	const parsed = parseSchoolClass(raw);
	if (!parsed) return { kind: 'skip', token: normalizeClass(raw) };
	if (parsed.year === 'IV') {
		return { kind: 'graduate', from: parsed.token, to: GRADUATE_CLASS };
	}
	const next = YEARS[YEARS.indexOf(parsed.year) + 1];
	return { kind: 'promote', from: parsed.token, to: `${next}.${parsed.letter}` };
}
