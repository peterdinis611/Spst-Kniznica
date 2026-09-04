import { pageMeta } from '@/utils/metadata';
import { listBookSlips } from '@/server/library';
import { layoutChrome } from '@/server/session';
import { FundLedger } from '@/components/FundLedger';

export const metadata = pageMeta({
	title: 'Všetky knihy',
	description: 'Register školského fondu SPŠT podľa odborov — signatúra, autor a voľné výtlačky.'
});

export default async function HoldingsPage() {
	const chrome = await layoutChrome('/holdings');
	const books = (await listBookSlips()).filter((book) => book.id !== 'book-modlitbicky');
	return <FundLedger books={books} categories={chrome.categories} />;
}
