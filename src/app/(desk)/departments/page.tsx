import { pageMeta } from '@/utils/metadata';
import { listBookSlips, listCategories } from '@/server/library';
import { booksLabel } from '@/utils/format';
import { ShelfSlider } from '@/components/ShelfSlider';

export const metadata = pageMeta({
	title: 'Odbory',
	description:
		'Police školskej knižnice SPŠT podľa odborov. Nájdite učebnice a príručky pre svoj smer.'
});

export default async function DepartmentsPage() {
	const [slips, catalog] = await Promise.all([listBookSlips(), listCategories()]);
	const books = slips.filter((book) => book.id !== 'book-modlitbicky');
	const categories = catalog.map((category) => ({
		...category,
		books: books.filter((book) => book.category.slug === category.slug).slice(0, 16)
	}));

	return (
		<>
			<p className="max-w-[40ch] font-body text-[1.08rem] leading-relaxed text-muted-foreground">
				Každý odbor má vlastnú policu. Otvor značku, alebo siahni rovno po chrbte.
			</p>
			<ol className="mt-10 m-0 grid min-w-0 list-none gap-10 p-0 [grid-template-columns:minmax(0,1fr)]">
				{categories.map((cat) => (
					<li key={cat.id} className="min-w-0 border-t border-border pt-6">
						<div className="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
							<a
								className="group min-w-0 text-inherit no-underline"
								href={`/departments/${cat.slug}`}
							>
								<p className="m-0 font-mono text-[0.72rem] font-semibold tracking-[0.16em] text-muted-foreground">
									{cat.code}
								</p>
								<h2 className="font-display mt-1 text-[clamp(1.45rem,7vw,2.25rem)] leading-none font-semibold tracking-[-0.03em] group-hover:underline group-hover:underline-offset-[0.14em]">
									{cat.name}
								</h2>
							</a>
							<p className="m-0 font-body text-[0.95rem] text-muted-foreground italic">
								{booksLabel(cat.bookCount)}
							</p>
						</div>
						<p className="mb-5 max-w-[46ch] font-body text-[1rem] leading-relaxed break-words text-muted-foreground">
							{cat.description}
						</p>
						{cat.books.length ? (
							<ShelfSlider
								books={cat.books}
								label={cat.name}
								moreHref={`/departments/${cat.slug}`}
							/>
						) : null}
					</li>
				))}
			</ol>
		</>
	);
}
