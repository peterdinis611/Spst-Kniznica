import { DESK_ROLES } from '$lib/ability';
import { HOLDING_STATUSES, RESERVATION_STATUSES } from '$lib/admin';
import { firstSchemaIssue } from '$lib/form-kit';
import { LOAN_DAYS_MAX, LOAN_DAYS_MIN, normalizeClass } from '$lib/borrow-fields';
import * as v from 'valibot';

function filled(message: string) {
	return v.pipe(v.string(), v.trim(), v.minLength(1, message));
}

function titled(message: string, min = 2) {
	return v.pipe(v.string(), v.trim(), v.minLength(min, message));
}

const holdingValues = HOLDING_STATUSES.map((item) => item.value) as [
	(typeof HOLDING_STATUSES)[number]['value'],
	...(typeof HOLDING_STATUSES)[number]['value'][]
];
const reservationValues = RESERVATION_STATUSES.map((item) => item.value) as [
	(typeof RESERVATION_STATUSES)[number]['value'],
	...(typeof RESERVATION_STATUSES)[number]['value'][]
];
const roleValues = DESK_ROLES.map((item) => item.value) as [
	(typeof DESK_ROLES)[number]['value'],
	...(typeof DESK_ROLES)[number]['value'][]
];

export const authorSchema = v.object({
	name: titled('Meno autora je krátke.'),
	role: filled('Doplň rolu autora.'),
	bio: filled('Doplň medailón.'),
	lifespan: filled('Doplň roky.')
});

export const categorySchema = v.object({
	name: titled('Názov odboru je krátky.'),
	code: v.pipe(
		v.string(),
		v.trim(),
		v.toUpperCase(),
		v.minLength(2, 'Kód odboru má 2–8 znakov.'),
		v.maxLength(8, 'Kód odboru má 2–8 znakov.')
	),
	description: filled('Dopíš popis odboru.'),
	accent: v.optional(v.string(), '#3c2a21'),
	sortOrder: v.optional(v.pipe(v.number(), v.integer()), 0)
});

export const bookSchema = v.object({
	title: titled('Názov knihy je krátky.'),
	subtitle: v.optional(v.string(), ''),
	isbn: filled('Doplň ISBN.'),
	callNumber: filled('Doplň signatúru.'),
	description: filled('Doplň anotáciu.'),
	publisher: filled('Doplň vydavateľa.'),
	categoryId: filled('Vyber odbor.'),
	language: v.optional(v.string(), 'sk'),
	year: v.pipe(
		v.number('Rok vydania nevyzerá.'),
		v.integer('Rok vydania nevyzerá.'),
		v.minValue(1400, 'Rok vydania nevyzerá.'),
		v.maxValue(2100, 'Rok vydania nevyzerá.')
	),
	pages: v.pipe(
		v.number('Počet strán musí byť kladný.'),
		v.integer('Počet strán musí byť kladný.'),
		v.minValue(1, 'Počet strán musí byť kladný.')
	),
	copies: v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(40)),
		1
	),
	featured: v.optional(v.boolean(), false)
});

export const readerSchema = v.object({
	name: titled('Meno čitateľa je krátke.'),
	email: v.pipe(
		v.string(),
		v.trim(),
		v.toLowerCase(),
		v.minLength(1, 'E-mail nevyzerá ako adresa.'),
		v.check((value) => value.includes('@'), 'E-mail nevyzerá ako adresa.')
	),
	role: v.optional(v.picklist(roleValues, 'Rola nie je v zozname.'))
});

export const holdingSchema = v.object({
	bookId: filled('Vyber knihu.'),
	inventoryNo: v.optional(v.string(), ''),
	status: v.picklist(holdingValues, 'Stav výtlačka nie je v zozname.'),
	acquiredAt: v.optional(v.string(), '')
});

export const reservationSchema = v.object({
	bookId: filled('Vyber knihu.'),
	userId: filled('Vyber čitateľa.'),
	status: v.picklist(reservationValues, 'Stav rezervácie nie je v zozname.'),
	createdAt: v.optional(v.string(), ''),
	expiresAt: v.optional(v.string(), '')
});

export const linkSchema = v.object({
	bookId: filled('Vyber knihu.'),
	authorId: filled('Vyber autora.'),
	position: v.pipe(v.number('Poradie musí byť číslo.'), v.integer(), v.minValue(0, 'Poradie nesmie byť záporné.'))
});

export const deskLoanSchema = v.object({
	bookId: filled('Vyber knihu.'),
	userId: filled('Vyber čitateľa.'),
	borrowerFirstName: titled('Meno a priezvisko na lístku.'),
	borrowerLastName: titled('Meno a priezvisko na lístku.'),
	borrowerClass: v.pipe(
		v.string(),
		v.transform(normalizeClass),
		v.minLength(1, 'Doplň triedu.')
	),
	loanDays: v.pipe(
		v.number('Doba výpožičky nie je v rozsahu.'),
		v.integer('Doba výpožičky nie je v rozsahu.'),
		v.minValue(LOAN_DAYS_MIN, 'Doba výpožičky nie je v rozsahu.'),
		v.maxValue(LOAN_DAYS_MAX, 'Doba výpožičky nie je v rozsahu.')
	),
	borrowedAt: v.optional(v.string(), ''),
	dueAt: v.optional(v.string(), ''),
	returnedAt: v.optional(v.string(), ''),
	renewalCount: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0)
});

export const deskClassFilterSchema = v.object({
	className: v.pipe(
		v.string(),
		v.transform(normalizeClass),
		v.check(
			(value) => !value || /^[\p{L}0-9]+([./-][\p{L}0-9]+)?$/u.test(value),
			'Trieda ako II.A alebo 3.INF.'
		)
	)
});

export const deskScanSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.minLength(2, 'Naskenuj inventár alebo ISBN.'))
});

export function deskIssue(schema: v.GenericSchema, data: unknown) {
	return firstSchemaIssue(schema, data);
}
