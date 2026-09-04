import { describe, expect, it } from 'vitest';
import { FOLIO_QUEUES, bossStateLabel, describeFolioJob, isFolioQueue } from '../folio-jobs';
import { deskTickAllowed } from '../tick-gate';

describe('describeFolioJob', () => {
	it('stamps a borrow slip from the hopper', () => {
		const copy = describeFolioJob(FOLIO_QUEUES.mail, {
			kind: 'loan',
			notice: {
				kind: 'borrow',
				to: 'peter@spst.sk',
				readerName: 'Peter Dinis',
				bookTitle: 'Algoritmy v dielni',
				callNumber: 'INF 004.4 ALG'
			}
		});
		expect(copy.title).toBe('Algoritmy v dielni');
		expect(copy.detail).toContain('Peter Dinis');
		expect(copy.stamp).toBe('výpožička');
	});

	it('stamps a hold and a class digest', () => {
		expect(
			describeFolioJob(FOLIO_QUEUES.mail, {
				kind: 'hold',
				notice: {
					kind: 'ready',
					to: 'a@spst.sk',
					readerName: 'Ana',
					bookTitle: 'Normy'
				}
			}).stamp
		).toBe('na pulte');
		expect(
			describeFolioJob(FOLIO_QUEUES.mail, {
				kind: 'class',
				digest: {
					to: 'ucitel@spst.sk',
					teacherName: 'Mgr. Kováč',
					className: 'II.A',
					open: 4,
					overdue: 1,
					rows: []
				}
			}).title
		).toBe('II.A');
	});

	it('stamps the desk tick', () => {
		expect(describeFolioJob(FOLIO_QUEUES.tick, { kind: 'tick' })).toEqual({
			title: 'Tik pultu',
			detail: 'lehoty, holdy, triedy',
			stamp: 'tik'
		});
	});
});

describe('bossStateLabel', () => {
	it('translates hopper states into desk stamps', () => {
		expect(bossStateLabel('created')).toBe('čaká');
		expect(bossStateLabel('retry')).toBe('čaká');
		expect(bossStateLabel('active')).toBe('beží');
		expect(bossStateLabel('completed')).toBe('hotovo');
		expect(bossStateLabel('failed')).toBe('zlyhalo');
		expect(bossStateLabel('cancelled')).toBe('zrušené');
	});

	it('keeps unknown folio queue names out of the hopper', () => {
		expect(isFolioQueue('folio-mail')).toBe(true);
		expect(isFolioQueue('desk-tick')).toBe(true);
		expect(isFolioQueue('other')).toBe(false);
	});
});

describe('deskTickAllowed', () => {
	it('opens only with a matching secret', () => {
		expect(deskTickAllowed('tick-secret', 'tick-secret')).toBe(true);
		expect(deskTickAllowed('tick-secret', 'nope')).toBe(false);
		expect(deskTickAllowed('', 'tick-secret')).toBe(false);
		expect(deskTickAllowed(undefined, undefined)).toBe(false);
	});
});
