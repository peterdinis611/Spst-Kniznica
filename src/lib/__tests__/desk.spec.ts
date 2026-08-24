import { describe, expect, it } from 'vitest';
import { deskTitle } from '../desk';

describe('deskTitle', () => {
	it('names the copper drawers', () => {
		expect(deskTitle('/discover')).toBe('Objavovať');
		expect(deskTitle('/holdings')).toBe('Všetky knihy');
		expect(deskTitle('/books/book-1')).toBe('Katalóg');
		expect(deskTitle('/departments/informatika')).toBe('Odbory');
		expect(deskTitle('/authors')).toBe('Autori');
		expect(deskTitle('/admin/knihy')).toBe('Pult');
		expect(deskTitle('/loans')).toBe('Moje knihy');
		expect(deskTitle('/login/heslo')).toBe('Účet');
		expect(deskTitle('/docs/sprava')).toBe('Príručka');
		expect(deskTitle('/')).toBe('SPŠT knižnica');
	});
});
