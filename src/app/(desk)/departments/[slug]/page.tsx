import { notFound } from 'next/navigation';
import { pageMeta } from '@/utils/metadata';
import { getCategory, listBookSlipsByCategory } from '@/server/library';
import { CatalogSlip } from '@/components/CatalogSlip';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const current = await getCategory(slug);
	if (!current) return pageMeta({ title: 'Odbor chýba', description: 'Polica v registri nie je.', index: false });
	return pageMeta({ title: current.name, description: current.description });
}

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const current = await getCategory(slug);
	if (!current) notFound();
	const books = await listBookSlipsByCategory(slug);

	return (
		<article>
			<p className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">{current.code}</p>
			<h1 className="font-display mt-2 text-[clamp(2rem,7vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
				{current.name}
			</h1>
			<p className="mt-4 max-w-[52ch] text-muted-foreground leading-relaxed">{current.description}</p>
			<div className="mt-8">
				{books.map((book) => (
					<CatalogSlip key={book.id} book={book} />
				))}
			</div>
		</article>
	);
}
