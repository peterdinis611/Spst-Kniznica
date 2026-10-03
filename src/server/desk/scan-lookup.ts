import { looksLikeIsbn } from '@/utils/isbn';
import { lookupIsbnCard, type IsbnCard } from './isbn';
import { findScanHit, type ScanHit } from './scan';

export type DeskScanLookup = {
	hit: ScanHit;
	card: IsbnCard | null;
	isbnNote: string | null;
};

export async function deskScanLookup(raw: string): Promise<DeskScanLookup> {
	const hit = await findScanHit(raw);
	if (hit.kind !== 'miss' || !looksLikeIsbn(raw)) {
		return { hit, card: null, isbnNote: null };
	}

	const lookup = await lookupIsbnCard(raw);
	if (lookup.ok) return { hit, card: lookup.card, isbnNote: null };
	return { hit, card: null, isbnNote: lookup.message };
}
