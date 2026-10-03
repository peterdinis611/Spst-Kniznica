import { normalizeClass } from '@/desk/borrow-fields';
import { canOpenDesk } from '@/server/admin-access';
import type { SignedReader } from '@/types';

export function canStampClass(actor: SignedReader | null | undefined, klass: string) {
	if (!actor || !canOpenDesk(actor)) return false;
	if (actor.role === 'librarian') return true;
	if (actor.role !== 'teacher') return false;
	return Boolean(normalizeClass(klass));
}
