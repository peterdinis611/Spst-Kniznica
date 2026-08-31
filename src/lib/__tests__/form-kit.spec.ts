import { describe, expect, it } from 'vitest';
import {
	authorSchema,
	bookSchema,
	categorySchema,
	deskClassFilterSchema,
	deskIssue,
	deskLoanSchema,
	holdingSchema,
	readerSchema,
	reservationSchema
} from '../desk-fields';
import { fieldIssue, firstSchemaIssue, flattenFields } from '../form-kit';
import { newPasswordSchema, signInSchema, signUpSchema } from '../auth-fields';

describe('flattenFields', () => {
	it('maps valibot issues onto field keys', () => {
		expect(flattenFields(signInSchema, { email: 'nie', password: '123' }).email).toMatch(/adresa/);
		expect(flattenFields(signInSchema, { email: 'nie', password: '123' }).password).toMatch(/8 znakov/);
	});

	it('puts a password mismatch on confirm', () => {
		expect(
			flattenFields(signUpSchema, {
				name: 'Anna Pult',
				email: 'anna@spst.sk',
				password: 'kniha12a',
				confirm: 'ineine12'
			}).confirm
		).toMatch(/nezhodujú/);
		expect(flattenFields(newPasswordSchema, { password: 'kniha12a', confirm: '' }).confirm).toMatch(
			/Zopakuj/
		);
	});
});

describe('fieldIssue', () => {
	it('reads a string, an array, or a message object', () => {
		expect(fieldIssue('Zadaj e-mail.')).toBe('Zadaj e-mail.');
		expect(fieldIssue([{ message: 'Zadaj e-mail.' }])).toBe('Zadaj e-mail.');
		expect(fieldIssue(undefined)).toBe('');
	});
});

describe('deskIssue', () => {
	it('keeps the pult copy for a thin author, book, and reader', () => {
		expect(deskIssue(authorSchema, { name: 'J', role: 'informatik', bio: 'Lektor.', lifespan: '1950 —' })).toBe(
			'Meno autora je krátke.'
		);
		expect(
			deskIssue(bookSchema, {
				title: 'A',
				isbn: '97880',
				callNumber: 'INF 004',
				description: 'Učebnica.',
				publisher: 'SPŠT',
				categoryId: 'cat-inf',
				year: 2020,
				pages: 120
			})
		).toBe('Názov knihy je krátky.');
		expect(deskIssue(readerSchema, { name: 'A', email: 'a@spst.sk' })).toBe('Meno čitateľa je krátke.');
		expect(deskIssue(readerSchema, { name: 'Anna Pult', email: 'nie-adresa' })).toBe(
			'E-mail nevyzerá ako adresa.'
		);
		expect(deskIssue(readerSchema, { name: 'Eva Učiteľ', email: 'eva@spst.sk', role: 'teacher' })).toBeUndefined();
		expect(deskIssue(holdingSchema, { bookId: 'book-1', status: 'broken' })).toBe(
			'Stav výtlačka nie je v zozname.'
		);
		expect(deskIssue(reservationSchema, { bookId: 'book-1', userId: 'user-1', status: 'waiting' })).toBe(
			'Stav rezervácie nie je v zozname.'
		);
		expect(
			deskIssue(deskLoanSchema, {
				bookId: 'book-1',
				userId: 'user-1',
				borrowerFirstName: 'P',
				borrowerLastName: 'Dinis',
				borrowerClass: 'II.A',
				loanDays: 21
			})
		).toBe('Meno a priezvisko na lístku.');
		expect(firstSchemaIssue(categorySchema, { name: 'I', code: 'INF', description: 'Algoritmy.' })).toBe(
			'Názov odboru je krátky.'
		);
		expect(deskIssue(deskClassFilterSchema, { className: '??' })).toMatch(/Trieda/);
		expect(deskIssue(deskClassFilterSchema, { className: 'II.A' })).toBeUndefined();
	});
});
