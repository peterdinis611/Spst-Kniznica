import Link from 'next/link';
import { pageMeta } from '@/utils/metadata';
import { listDiscoverDesk } from '@/server/library';
import { authorLine, booksLabel, copiesLabel, initials, splitCallNumber } from '@/utils/format';
import { authorSwatch } from '@/catalog/cover';
import { cn } from '@/utils/cn';
import { PrintJacket } from '@/components/PrintJacket';
import { CoverRail } from '@/components/CoverRail';

export const metadata = pageMeta({
	title: 'Objavovať',
	description: 'Odporúčané knihy, police odborov a novinky vo fonde školskej knižnice SPŠT.'
});

export default async function DiscoverPage() {
	const { featured: featuredSlip, shelf, authors, stats } = await listDiscoverDesk();
	const featuredCall = featuredSlip ? splitCallNumber(featuredSlip.callNumber) : null;
	const display = 'font-display m-0 font-semibold tracking-[-0.03em] leading-[1.06]';
	const rise =
		'animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 motion-reduce:animate-none';

	return (
		<div className="text-foreground pt-1 sm:pt-2">
			{featuredSlip && featuredCall ? (
				<section
					data-tour="featured"
					className={cn(
						'relative overflow-hidden rounded-[1.7rem] bg-[#2a1c16] text-[#f6efe4]',
						'dark:bg-[#322820] dark:text-[#f6efe4] dark:shadow-[inset_0_0_0_1px_rgb(224_122_82_/_0.42)]',
						'bg-[radial-gradient(ellipse_at_18%_0%,rgb(196_90_56/0.28),transparent_42%),linear-gradient(180deg,transparent_70%,rgb(0_0_0/0.12))]',
						rise
					)}
				>
					<div className="grid grid-cols-1 items-end gap-3.5 px-4 py-4 min-[420px]:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8 sm:px-6 sm:py-8 md:gap-12 md:px-10 md:py-10 lg:grid-cols-[auto_minmax(0,1fr)_11.5rem]">
						<Link className="group w-fit no-underline" href={`/books/${featuredSlip.id}`}>
							<span className="block origin-bottom transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-2 motion-reduce:transform-none">
								<span className="sm:hidden">
									<PrintJacket
										book={featuredSlip}
										size="thumb"
										linked={false}
										className="shadow-[6px_10px_0_rgb(0_0_0/0.16)] ring-0 hover:!transform-none"
									/>
								</span>
								<span className="hidden sm:block">
									<PrintJacket
										book={featuredSlip}
										size="feature"
										linked={false}
										className="shadow-[12px_18px_0_rgb(0_0_0/0.18)] ring-0 hover:!transform-none"
									/>
								</span>
							</span>
						</Link>
						<div className="min-w-0 pb-0.5">
							<p className="m-0 font-sans text-[0.62rem] font-semibold tracking-[0.16em] uppercase opacity-80 sm:text-[0.72rem] sm:tracking-[0.18em]">
								Dnes na pulte
							</p>
							<h2
								className={cn(
									display,
									'mt-1.5 max-w-[14ch] text-[clamp(1.35rem,6.4vw,3.5rem)] sm:mt-3'
								)}
							>
								<Link
									className="text-inherit no-underline decoration-from-font hover:underline"
									href={`/books/${featuredSlip.id}`}
								>
									{featuredSlip.title}
								</Link>
							</h2>
							<p className="mt-2 max-w-[42ch] text-[0.95rem] opacity-80">
								{authorLine(featuredSlip.authors)}
							</p>
							<p className="mt-4 font-mono text-[0.68rem] tracking-[0.12em] uppercase opacity-80">
								{featuredCall.dept} {featuredCall.number} ·{' '}
								{copiesLabel(featuredSlip.copiesAvailable, featuredSlip.copiesTotal)}
							</p>
						</div>
					</div>
				</section>
			) : null}

			<section className="mt-12">
				<p className="folio-kicker">Pracovné zväzky</p>
				<h2 className="font-display mt-2 text-[clamp(1.6rem,5vw,2.6rem)]">Otoč policu.</h2>
				<p className="text-muted-foreground mt-2">
					{stats.available} voľných výtlačkov z {stats.books} kníh.
				</p>
				<div className="mt-6">
					<CoverRail books={shelf} />
				</div>
			</section>

			<section className="mt-16">
				<p className="folio-kicker">Menný katalóg</p>
				<h2 className="font-display mt-2 text-[clamp(1.6rem,5vw,2.6rem)]">Autori na polici.</h2>
				<ul className="mt-6 grid gap-3 sm:grid-cols-2">
					{authors.map((author) => (
						<li key={author.id}>
							<Link
								className="flex items-center gap-3 no-underline"
								href={`/authors/${author.slug}`}
							>
								<span
									className="grid size-11 place-items-center rounded-full font-display text-sm font-semibold text-white ring-1 ring-black/15 dark:ring-white/25"
									style={{ background: authorSwatch(author.id) }}
								>
									{initials(author.name)}
								</span>
								<span>
									<strong className="font-display text-lg">{author.name}</strong>
									<em className="text-muted-foreground ml-2 not-italic">
										{booksLabel(author.bookCount)}
									</em>
								</span>
							</Link>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
