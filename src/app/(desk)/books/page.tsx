import Link from 'next/link';
import { pageMeta } from '@/utils/metadata';
import { listBookSlips, listCategoryChips } from '@/server/library';
import { BookRegister } from '@/components/BookRegister';

export const metadata = pageMeta({
	title: 'Katalóg',
	description:
		'Prehľadaj školský fond SPŠT podľa názvu, autora, signatúry alebo odboru. Voľné výtlačky uvidíš hneď.'
});

export default async function BooksPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; odbor?: string }>;
}) {
	const params = await searchParams;
	const q = params.q ?? '';
	const odbor = params.odbor ?? '';
	const [slips, categories] = await Promise.all([
		listBookSlips(q || undefined),
		listCategoryChips()
	]);
	const books = odbor ? slips.filter((item) => item.category.slug === odbor) : slips;
	const activeName = categories.find((cat) => cat.slug === odbor)?.name;

	return (
		<>
			<p className="text-sm text-muted-foreground">
				{books.length.toLocaleString('sk-SK')} kníh
				{q ? ` pre „${q}“` : ''}
				{activeName ? ` · ${activeName}` : ''}
				{books.length > 48 ? (
					<span className="hidden sm:inline"> · virtualizovaný register</span>
				) : null}
			</p>
			<div className="mt-4 flex flex-wrap gap-2">
				<Link
					href="/books"
					className={`inline-flex h-8 items-center rounded-full px-3 text-sm no-underline ${!odbor ? 'bg-primary text-primary-foreground' : 'ring-1 ring-border'}`}
				>
					Všetko
				</Link>
				{categories.map((cat) => (
					<Link
						key={cat.id}
						href={`/books?odbor=${cat.slug}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
						className={`inline-flex h-8 items-center rounded-full px-3 text-sm no-underline ${odbor === cat.slug ? 'bg-primary text-primary-foreground' : 'ring-1 ring-border'}`}
					>
						<span className="sm:hidden">{cat.code}</span>
						<span className="hidden sm:inline">{cat.name}</span>
					</Link>
				))}
			</div>
			{books.length === 0 ? (
				<div className="mt-10 rounded-2xl p-6 ring-1 ring-border">
					<p className="font-display text-xl">Nič sa nenašlo</p>
					<p className="mt-2 text-muted-foreground">Skús iné slovo, alebo zruš filter.</p>
					<Link href="/books" className="mt-4 inline-block text-sm underline">
						Zrušiť filter
					</Link>
				</div>
			) : (
				<BookRegister books={books} />
			)}
		</>
	);
}
