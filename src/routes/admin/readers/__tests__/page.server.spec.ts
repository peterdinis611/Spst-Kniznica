import { isActionFailure } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReader, listDeskReaders, saveReader } from '$lib/server/desk/readers';
import { rollSchoolYear } from '$lib/server/desk/classes';
import { actions, load } from '../+page.server';

vi.mock('$lib/server/desk/readers', () => ({
	listDeskReaders: vi.fn(),
	getDeskReader: vi.fn(),
	saveReader: vi.fn(),
	deleteReader: vi.fn()
}));

vi.mock('$lib/server/desk/classes', () => ({
	rollSchoolYear: vi.fn()
}));

const row = {
	id: 'user-1',
	name: 'Anna Pult',
	email: 'anna@spst.sk',
	role: 'librarian',
	className: '',
	emailVerified: true,
	createdAt: new Date(2026, 7, 1),
	loanCount: 2
};

function event(fields: Record<string, string>) {
	return {
		request: {
			formData: async () => {
				const body = new FormData();
				for (const [key, value] of Object.entries(fields)) body.set(key, value);
				return body;
			}
		}
	} as unknown as Parameters<NonNullable<typeof actions.save>>[0];
}

describe('admin citately load', () => {
	it('picks the edited pass', async () => {
		vi.mocked(listDeskReaders).mockResolvedValue([row]);
		const data = (await load({
			url: new URL('http://localhost/admin/readers?edit=user-1')
		} as Parameters<typeof load>[0])) as { current: typeof row | null };
		expect(data.current?.email).toBe('anna@spst.sk');
	});
});

describe('admin citately actions', () => {
	beforeEach(() => {
		vi.mocked(saveReader).mockReset();
		vi.mocked(deleteReader).mockReset();
	});

	it('saves a name and email', async () => {
		vi.mocked(saveReader).mockResolvedValue({ ok: true });
		const result = await actions.save?.(
			event({ id: 'user-1', name: 'Anna Pult', email: 'anna@spst.sk', role: 'librarian' })
		);
		expect(saveReader).toHaveBeenCalledWith({
			id: 'user-1',
			name: 'Anna Pult',
			email: 'anna@spst.sk',
			role: 'librarian',
			className: ''
		});
		expect(result).toEqual({ stamp: 'Uložené' });
	});

	it('blocks a delete while books are out', async () => {
		vi.mocked(deleteReader).mockResolvedValue({
			ok: false,
			message: 'Čitateľ má knihy vonku. Najprv ich vráť.'
		});
		const result = await actions.delete?.(event({ id: 'user-1' }));
		expect(isActionFailure(result)).toBe(true);
		if (isActionFailure(result)) {
			expect(result.data).toEqual({ message: 'Čitateľ má knihy vonku. Najprv ich vráť.' });
		}
	});

	it('stamps a September year roll', async () => {
		vi.mocked(rollSchoolYear).mockResolvedValue({ promoted: 12, graduated: 3 });
		const result = await actions.rollYear?.(event({}));
		expect(result).toEqual({ stamp: '12 posunutých · 3 absolventov' });
	});
});
