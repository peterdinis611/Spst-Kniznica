import { describe, expect, it } from 'vitest';
import { canInspectDesk, canManageDesk, defineAbilityFor, isRole, parseRole } from '../ability';

describe('parseRole', () => {
	it('keeps librarian and teacher stamps, and treats everything else as a reader', () => {
		expect(parseRole('librarian')).toBe('librarian');
		expect(parseRole('teacher')).toBe('teacher');
		expect(parseRole('reader')).toBe('reader');
		expect(parseRole('admin')).toBe('reader');
		expect(parseRole(undefined)).toBe('reader');
		expect(isRole('librarian')).toBe(true);
		expect(isRole('teacher')).toBe(true);
		expect(isRole('guest')).toBe(false);
	});
});

describe('defineAbilityFor', () => {
	it('lets a guest read the catalog and nothing on the desk', () => {
		const ability = defineAbilityFor(null);
		expect(ability.can('read', 'Catalog')).toBe(true);
		expect(ability.can('borrow', 'Loan')).toBe(false);
		expect(ability.can('manage', 'Desk')).toBe(false);
		expect(canManageDesk(null)).toBe(false);
		expect(canInspectDesk(null)).toBe(false);
	});

	it('lets a reader borrow and return, but not open the desk', () => {
		const ability = defineAbilityFor('reader');
		expect(ability.can('borrow', 'Loan')).toBe(true);
		expect(ability.can('return', 'Loan')).toBe(true);
		expect(ability.can('manage', 'Desk')).toBe(false);
		expect(canManageDesk('reader')).toBe(false);
	});

	it('lets a teacher inspect the desk without managing the fund', () => {
		const ability = defineAbilityFor('teacher');
		expect(ability.can('inspect', 'Desk')).toBe(true);
		expect(ability.can('read', 'Loan')).toBe(true);
		expect(ability.can('manage', 'Desk')).toBe(false);
		expect(ability.can('manage', 'Catalog')).toBe(false);
		expect(canInspectDesk('teacher')).toBe(true);
		expect(canManageDesk('teacher')).toBe(false);
	});

	it('lets a librarian manage the desk', () => {
		const ability = defineAbilityFor('librarian');
		expect(ability.can('manage', 'Desk')).toBe(true);
		expect(ability.can('manage', 'Catalog')).toBe(true);
		expect(ability.can('manage', 'Loan')).toBe(true);
		expect(canManageDesk('librarian')).toBe(true);
		expect(canInspectDesk('librarian')).toBe(true);
	});
});
