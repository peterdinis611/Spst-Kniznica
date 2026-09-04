import { notFound } from 'next/navigation';
import { pageMeta } from '@/utils/metadata';
import { getCategory, listBookSlipsByCategory } from '@/server/library';
import { booksLabel } from '@/utils/format';
import { BookRegister } from '@/components/BookRegister';
import { ShelfSlider } from '@/components/ShelfSlider';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const current = await getCategory(slug);
	if (!current)
		return pageMeta({
			title: 'Odbor chýba',
			description: 'Polica v registri nie je.',
			index: false
		});
	return pageMeta({ title: current.name, description: current.description });
}

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const current = await getCategory(slug);
	if (!current) notFound();
	const books = await listBookSlipsByCategory(slug);
	const preview = books.slice(0, 16);

	return (
		<article className="min-w-0">
			<p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
				{current.code}
			</p>
			<div className="mt-2 flex min-w-0 flex-wrap items-end justify-between gap-3">
				<h1 className="font-display text-[clamp(2rem,7vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
					{current.name}
				</h1>
				<p className="font-body text-[0.95rem] text-muted-foreground italic">
					{booksLabel(books.length)}
				</p>
			</div>
			<p className="text-muted-foreground mt-4 max-w-[52ch] leading-relaxed">
				{current.description}
			</p>
			{preview.length ? (
				<div className="mt-8">
					<ShelfSlider
						books={preview}
						label={current.name}
						moreHref={`/books?odbor=${current.slug}`}
						moreLabel="Do katalógu"
					/>
				</div>
			) : null}
			<p className="folio-kicker mt-10">Register</p>
			<BookRegister books={books} />
		</article>
	);
}
