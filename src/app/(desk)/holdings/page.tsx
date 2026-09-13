import { FolioLink as Link } from '@/components/FolioLink';
import { pageMeta } from '@/utils/metadata';
import { listCategoryChips, pageBookSlips } from '@/server/library';
import { registerHref } from '@/catalog/register-page';
import { FundLedger } from '@/components/FundLedger';
import { FolioPager } from '@/components/FolioPager';

export const metadata = pageMeta({
	title: 'Všetky knihy',
	description: 'Register školského fondu SPŠT podľa odborov — signatúra, autor a voľné výtlačky.'
});

export default async function HoldingsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; odbor?: string; strana?: string }>;
}) {
	const params = await searchParams;
	const q = params.q ?? '';
	const odbor = params.odbor ?? '';
	const [leaf, categories] = await Promise.all([
		pageBookSlips({ q, categorySlug: odbor, page: params.strana }),
		listCategoryChips()
	]);

	return (
		<>
			<div className="mb-6 flex flex-wrap gap-2">
				<Link
					href={registerHref('/holdings', { q })}
					className={`inline-flex h-8 items-center rounded-full px-3 text-sm no-underline ${!odbor ? 'bg-primary text-primary-foreground' : 'ring-1 ring-border'}`}
				>
					Všetky odbory
				</Link>
				{categories.map((cat) => (
					<Link
						key={cat.id}
						href={registerHref('/holdings', { q, odbor: cat.slug })}
						className={`inline-flex h-8 items-center rounded-full px-3 text-sm no-underline ${odbor === cat.slug ? 'bg-primary text-primary-foreground' : 'ring-1 ring-border'}`}
					>
						<span className="sm:hidden">{cat.code}</span>
						<span className="hidden sm:inline">{cat.name}</span>
					</Link>
				))}
			</div>
			<FundLedger books={leaf.books} categories={categories} total={leaf.total} />
			<FolioPager
				path="/holdings"
				q={q}
				odbor={odbor}
				page={leaf.page}
				pages={leaf.pages}
				total={leaf.total}
			/>
		</>
	);
}
