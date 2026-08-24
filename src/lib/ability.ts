import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export const ROLES = ['reader', 'librarian'] as const;
export type Role = (typeof ROLES)[number];

export const DESK_ROLES = [
	{ value: 'reader', label: 'čitateľ' },
	{ value: 'librarian', label: 'knihovník' }
] as const;

export const ROLE_LABELS: Record<Role, string> = {
	reader: 'čitateľ',
	librarian: 'knihovník'
};

export type Actions = 'read' | 'borrow' | 'return' | 'manage';
export type Subjects = 'Catalog' | 'Loan' | 'Desk';
export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function isRole(value: unknown): value is Role {
	return value === 'reader' || value === 'librarian';
}

export function parseRole(value: unknown): Role {
	return value === 'librarian' ? 'librarian' : 'reader';
}

export function defineAbilityFor(role: Role | null | undefined): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

	can('read', 'Catalog');

	if (role === 'librarian') {
		can('manage', 'Catalog');
		can('manage', 'Loan');
		can('manage', 'Desk');
	} else if (role === 'reader') {
		can('borrow', 'Loan');
		can('return', 'Loan');
	}

	return build();
}

export function canManageDesk(role: Role | null | undefined) {
	return defineAbilityFor(role).can('manage', 'Desk');
}
