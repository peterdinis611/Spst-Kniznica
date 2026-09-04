import { notFound } from 'next/navigation';
import { pageMeta } from '@/utils/metadata';
import { getAuthor, listBookSlipsByAuthor } from '@/server/library';
import { booksLabel } from '@/utils/format';
import { CatalogSlip } from '@/components/CatalogSlip';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const person = await getAuthor(slug);
	if (!person) return pageMeta({ title: 'Autor chýba', description: 'Meno v registri nie je.', index: false });
	return pageMeta({
		title: person.name,
		description: person.bio || `Zväzky autora ${person.name} vo fonde SPŠT.`
	});
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const person = await getAuthor(slug);
	if (!person) notFound();
	const books = await listBookSlipsByAuthor(slug);

	return (
		<article>
			<p className="text-muted-foreground font-mono text-xs tracking-[0.16em] uppercase">{person.role}</p>
			<h1 className="font-display mt-2 text-[clamp(2rem,7vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
				{person.name}
			</h1>
			{person.lifespan ? <p className="text-muted-foreground mt-2">{person.lifespan}</p> : null}
			{person.bio ? <p className="mt-6 max-w-[52ch] leading-relaxed">{person.bio}</p> : null}
			<p className="mt-8 text-muted-foreground">{booksLabel(books.length)}</p>
			<div className="mt-4">
				{books.map((book) => (
					<CatalogSlip key={book.id} book={book} />
				))}
			</div>
		</article>
	);
}
