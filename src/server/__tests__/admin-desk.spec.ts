import { describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ db: {} }));

import { saveAuthor } from '../desk/authors';
import { saveBook } from '../desk/books';
import { saveCategory } from '../desk/categories';
import { saveHolding } from '../desk/holdings';
import { saveLoan } from '../desk/loans';
import { saveReader } from '../desk/readers';
import { saveReservation } from '../desk/reservations';

describe('desk validation', () => {
	it('rejects a thin department card before touching the fund', async () => {
		expect(
			await saveCategory({
				name: 'I',
				slug: '',
				description: 'Algoritmy.',
				code: 'INF',
				accent: '#2c4a3e',
				sortOrder: 1
			})
		).toEqual({ ok: false, message: 'Názov odboru je krátky.' });

		expect(
			await saveCategory({
				name: 'Informatika',
				slug: '',
				description: 'Algoritmy.',
				code: 'I',
				accent: '#2c4a3e',
				sortOrder: 1
			})
		).toEqual({ ok: false, message: 'Kód odboru má 2–8 znakov.' });

		expect(
			await saveCategory({
				name: 'Informatika',
				slug: '',
				description: '  ',
				code: 'INF',
				accent: '#2c4a3e',
				sortOrder: 1
			})
		).toEqual({ ok: false, message: 'Dopíš popis odboru.' });
	});

	it('rejects an incomplete author medallion', async () => {
		expect(
			await saveAuthor({
				name: 'J',
				slug: '',
				bio: 'Lektor.',
				lifespan: '1950 —',
				role: 'informatik'
			})
		).toEqual({ ok: false, message: 'Meno autora je krátke.' });
		expect(
			await saveAuthor({
				name: 'Ján Belko',
				slug: '',
				bio: 'Lektor.',
				lifespan: '1950 —',
				role: ''
			})
		).toEqual({ ok: false, message: 'Doplň rolu autora.' });
		expect(
			await saveAuthor({
				name: 'Ján Belko',
				slug: '',
				bio: '',
				lifespan: '1950 —',
				role: 'informatik'
			})
		).toEqual({ ok: false, message: 'Doplň medailón.' });
	});

	it('rejects a book slip with missing catalog fields', async () => {
		const base = {
			subtitle: '',
			year: 2020,
			pages: 120,
			isbn: '97880',
			description: 'Učebnica.',
			callNumber: 'INF 004',
			categoryId: 'cat-inf',
			publisher: 'SPŠT',
			language: 'sk',
			featured: false,
			authorIds: [] as string[]
		};
		expect(await saveBook({ ...base, title: 'A' })).toEqual({
			ok: false,
			message: 'Názov knihy je krátky.'
		});
		expect(await saveBook({ ...base, title: 'Algoritmy', isbn: '' })).toEqual({
			ok: false,
			message: 'Doplň ISBN.'
		});
		expect(await saveBook({ ...base, title: 'Algoritmy', year: 900 })).toEqual({
			ok: false,
			message: 'Rok vydania nevyzerá.'
		});
		expect(await saveBook({ ...base, title: 'Algoritmy', pages: 0 })).toEqual({
			ok: false,
			message: 'Počet strán musí byť kladný.'
		});
	});

	it('rejects a loan without a borrower or a valid period', async () => {
		expect(
			await saveLoan({
				bookId: 'book-1',
				holdingId: '',
				userId: 'user-1',
				borrowerFirstName: 'P',
				borrowerLastName: 'Dinis',
				borrowerClass: 'II.A',
				loanDays: 21
			})
		).toEqual({ ok: false, message: 'Meno a priezvisko na lístku.' });
		expect(
			await saveLoan({
				bookId: 'book-1',
				holdingId: '',
				userId: 'user-1',
				borrowerFirstName: 'Peter',
				borrowerLastName: 'Dinis',
				borrowerClass: '',
				loanDays: 21
			})
		).toEqual({ ok: false, message: 'Doplň triedu.' });
		expect(
			await saveLoan({
				bookId: 'book-1',
				holdingId: '',
				userId: 'user-1',
				borrowerFirstName: 'Peter',
				borrowerLastName: 'Dinis',
				borrowerClass: 'II.A',
				loanDays: 0
			})
		).toEqual({ ok: false, message: 'Doba výpožičky nie je v rozsahu.' });
	});

	it('rejects an unknown holding or reservation stamp', async () => {
		expect(await saveHolding({ bookId: 'book-1', inventoryNo: 'INF-1', status: 'broken' })).toEqual(
			{ ok: false, message: 'Stav výtlačka nie je v zozname.' }
		);
		expect(
			await saveReservation({ bookId: 'book-1', userId: 'user-1', status: 'waiting' })
		).toEqual({ ok: false, message: 'Stav rezervácie nie je v zozname.' });
	});

	it('rejects a thin reader pass', async () => {
		expect(await saveReader({ id: 'user-1', name: 'A', email: 'a@spst.sk' })).toEqual({
			ok: false,
			message: 'Meno čitateľa je krátke.'
		});
		expect(await saveReader({ id: 'user-1', name: 'Anna Pult', email: 'nie-adresa' })).toEqual({
			ok: false,
			message: 'E-mail nevyzerá ako adresa.'
		});
		expect(
			await saveReader({ id: 'user-1', name: 'Anna Pult', email: 'a@spst.sk', role: 'admin' })
		).toEqual({
			ok: false,
			message: 'Rola nie je v zozname.'
		});
	});
});
