export const LOAN_DAY_OPTIONS = [7, 14, 21] as const;
export const LOAN_DAYS_MIN = 1;
export const LOAN_DAYS_MAX = 90;

export type BorrowFields = {
	firstName?: string;
	lastName?: string;
	className?: string;
	days?: string;
};

export type BorrowErrors = {
	firstName?: string;
	lastName?: string;
	className?: string;
	days?: string;
};

const titlePrefix = /^(Prof|Mgr|Ing|PaedDr|PhDr|Doc|RNDr|Bc)\.\s+/i;

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

function validatePersonName(raw: string, label: 'Meno' | 'Priezvisko') {
	const name = raw.trim();
	if (name.length < 2) return `${label} musí mať aspoň dve písmená.`;
	if (name.length > 40) return `${label} je príliš dlhé.`;
	if (!/\p{L}/u.test(name)) return `${label} musí obsahovať písmeno.`;
	return undefined;
}

export function validateClass(raw: string) {
	const value = normalizeClass(raw);
	if (!value) return 'Zadaj triedu.';
	if (value.length < 2 || value.length > 12) return 'Trieda vyzerá krátko alebo dlho.';
	if (!/^[\p{L}0-9]+([./-][\p{L}0-9]+)?$/u.test(value)) {
		return 'Trieda ako II.A alebo 3.INF.';
	}
	return undefined;
}

export function parseLoanDays(raw: string) {
	const days = Number(String(raw).trim());
	if (!Number.isInteger(days) || days < LOAN_DAYS_MIN || days > LOAN_DAYS_MAX) return undefined;
	return days;
}

export function validateLoanDays(raw: string) {
	if (!parseLoanDays(raw)) return `Zadaj dobu od ${LOAN_DAYS_MIN} do ${LOAN_DAYS_MAX} dní.`;
	return undefined;
}

export function validateBorrow(fields: BorrowFields): BorrowErrors {
	return {
		firstName: validatePersonName(fields.firstName ?? '', 'Meno'),
		lastName: validatePersonName(fields.lastName ?? '', 'Priezvisko'),
		className: validateClass(fields.className ?? ''),
		days: validateLoanDays(fields.days ?? '')
	};
}
