import * as v from 'valibot';

export const LOAN_DAY_OPTIONS = [7, 14, 21] as const;
export const LOAN_DAYS_MIN = 1;
export const LOAN_DAYS_MAX = 90;

export type BorrowFields = {
	firstName?: string;
	lastName?: string;
	className?: string;
	days?: string | number;
};

export type BorrowErrors = {
	firstName?: string;
	lastName?: string;
	className?: string;
	days?: string;
};

const titlePrefix = /^(Prof|Mgr|Ing|PaedDr|PhDr|Doc|RNDr|Bc)\.\s+/i;
const DAYS_MSG = `Zadaj dobu od ${LOAN_DAYS_MIN} do ${LOAN_DAYS_MAX} dní.`;

export function hasBorrowErrors(errors: BorrowErrors) {
	return Boolean(errors.firstName || errors.lastName || errors.className || errors.days);
}

export function splitReaderName(name: string) {
	const parts = name
		.replace(titlePrefix, '')
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (parts.length === 0) return { firstName: '', lastName: '' };
	if (parts.length === 1) return { firstName: parts[0], lastName: '' };
	return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) ?? '' };
}

export function normalizeClass(raw: string) {
	return raw.trim().replace(/\s+/g, '').toUpperCase();
}

function personName(label: 'Meno' | 'Priezvisko') {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(2, `${label} musí mať aspoň dve písmená.`),
		v.maxLength(40, `${label} je príliš dlhé.`),
		v.regex(/\p{L}/u, `${label} musí obsahovať písmeno.`)
	);
}

export const borrowSchema = v.object({
	firstName: personName('Meno'),
	lastName: personName('Priezvisko'),
	className: v.pipe(
		v.string(),
		v.transform(normalizeClass),
		v.minLength(1, 'Zadaj triedu.'),
		v.minLength(2, 'Trieda vyzerá krátko alebo dlho.'),
		v.maxLength(12, 'Trieda vyzerá krátko alebo dlho.'),
		v.regex(/^[\p{L}0-9]+([./-][\p{L}0-9]+)?$/u, 'Trieda ako II.A alebo 3.INF.')
	),
	days: v.pipe(
		v.number(DAYS_MSG),
		v.integer(DAYS_MSG),
		v.minValue(LOAN_DAYS_MIN, DAYS_MSG),
		v.maxValue(LOAN_DAYS_MAX, DAYS_MSG)
	)
});

export type BorrowSlipValues = v.InferInput<typeof borrowSchema>;

function firstIssue(messages: string[] | undefined) {
	return messages?.[0];
}

export function validateBorrow(fields: BorrowFields): BorrowErrors {
	const days =
		typeof fields.days === 'number' ? fields.days : Number(String(fields.days ?? '').trim());
	const result = v.safeParse(borrowSchema, {
		firstName: fields.firstName ?? '',
		lastName: fields.lastName ?? '',
		className: fields.className ?? '',
		days
	});
	if (result.success) return {};
	const nested = v.flatten(result.issues).nested;
	return {
		firstName: firstIssue(nested?.firstName),
		lastName: firstIssue(nested?.lastName),
		className: firstIssue(nested?.className),
		days: firstIssue(nested?.days)
	};
}

export function parseLoanDays(raw: string) {
	const days = Number(String(raw).trim());
	if (!Number.isInteger(days) || days < LOAN_DAYS_MIN || days > LOAN_DAYS_MAX) return undefined;
	return days;
}

export function fieldIssue(error: unknown): string {
	if (!error) return '';
	if (typeof error === 'string') return error;
	if (Array.isArray(error)) return fieldIssue(error[0]);
	if (typeof error === 'object' && 'message' in error) return String(error.message ?? '');
	return String(error);
}
