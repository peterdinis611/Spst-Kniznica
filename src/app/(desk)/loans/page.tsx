import Link from 'next/link';
import { pageMeta } from '@/utils/metadata';
import { authorLine, dueStatus, firstName, loanedLabel, readerNumber } from '@/utils/format';
import { BookCover } from '@/components/BookCover';
import { HistoryClear, LoanReturn, WaitCancel } from '@/components/LoanMutations';
import { loadLoans } from './actions';
import '@/components/loans-ticket.css';

export const metadata = pageMeta({
	title: 'Moja knižnica',
	description: 'Aktívne výpožičky a vrátenia v školskej knižnici SPŠT.',
	index: false
});

export default async function LoansPage() {
	const data = await loadLoans();
	const serial = readerNumber(data.reader.id);
	const given = firstName(data.reader.name);

	return (
		<section className="relative isolate mx-auto mb-6 grid max-w-5xl min-w-0 gap-7 min-[860px]:grid-cols-[minmax(0,1.05fr)_minmax(22rem,26.5rem)] min-[860px]:items-start min-[860px]:gap-0 min-[860px]:py-1.5 min-[860px]:pb-8">
			<div className="loans-copy relative z-[1] max-w-md pt-1 min-[860px]:pt-5 min-[860px]:pr-[4.5rem]">
				<p className="font-mono text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
					pavilón B · lehota na lístku
				</p>
				<p className="mt-3.5 max-w-[9ch] font-display text-[clamp(2.6rem,8vw,4.5rem)] leading-[0.9] font-bold tracking-[-0.045em] text-balance text-foreground">
					Koľko treba.
				</p>
				<p className="mt-[1.15rem] max-w-[22rem] font-body text-[1.12rem] leading-[1.45] text-muted-foreground">
					{given}, pri výpožičke vyplníš meno, triedu a dobu. Ber si toľko zväzkov, koľko potrebuješ
					— strop na preukaze nie je.
				</p>
				<ul className="mt-[1.35rem] flex list-none flex-wrap gap-1.5 p-0">
					{['7–21 dní', 'bez stropu', 'pav. B'].map((fact) => (
						<li
							key={fact}
							className="rounded-full border border-foreground/16 px-2.5 py-1 font-mono text-[0.68rem] font-semibold tracking-[0.08em] text-foreground uppercase"
						>
							{fact}
						</li>
					))}
				</ul>
			</div>
			<article className="loans-ticket relative z-[2] min-w-0 rounded-[1.15rem] px-5 pt-5 pb-4 pl-[2.15rem] min-[860px]:mt-10 min-[860px]:-ml-11">
				<span className="loans-spine" aria-hidden="true" />
				<header className="relative z-[1]">
					<p className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] uppercase">
						výpožičný lístok
					</p>
					<p className="mt-1 font-mono text-[0.68rem] tracking-[0.14em] uppercase opacity-70">
						{serial}
					</p>
					<h1 className="mt-2 font-display text-[clamp(1.6rem,4vw,2.35rem)] leading-none">
						{data.reader.name}
					</h1>
					<p className="mt-1 text-sm opacity-70">
						{loanedLabel(data.activeCount)} · {data.waits.length} v rade
						{data.orders.length ? ` · ${data.orders.length} v zásobníku` : ''}
					</p>
				</header>
				{data.loans.length === 0 ? (
					<p className="relative z-[1] mt-6 opacity-70">Žiadny zväzok práve nie je na preukaze.</p>
				) : (
					<ul className="relative z-[1] mt-6 grid gap-4">
						{data.loans.map((item) => {
							const due = dueStatus(item.dueAt);
							return (
								<li key={item.id} className="flex gap-4 border-t border-current/15 pt-4">
									<BookCover book={item.book} size="thumb" />
									<div className="min-w-0">
										<p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase opacity-60">
											{item.book.callNumber}
										</p>
										<Link
											href={`/books/${item.book.id}`}
											className="font-display text-xl no-underline"
										>
											{item.book.title}
										</Link>
										<p className="text-sm opacity-70">{authorLine(item.book.authors)}</p>
										<p className="mt-2 text-sm">{due.label}</p>
										<LoanReturn loanId={item.id} canRenew={item.canRenew} />
									</div>
								</li>
							);
						})}
					</ul>
				)}
				{data.orders.length ? (
					<section className="relative z-[1] mt-10">
						<h2 className="font-display text-2xl">V zásobníku</h2>
						<ul className="mt-4 grid gap-3">
							{data.orders.map((order) => (
								<li key={order.id}>
									<Link href={`/books/${order.bookId}`} className="no-underline">
										{order.title} · čaká na pečiatku
									</Link>
								</li>
							))}
						</ul>
					</section>
				) : null}
				{data.waits.length ? (
					<section className="relative z-[1] mt-10">
						<h2 className="font-display text-2xl">V rade</h2>
						<ul className="mt-4 grid gap-3">
							{data.waits.map((wait) => (
								<li key={wait.id} className="flex items-center justify-between gap-3">
									<Link href={`/books/${wait.book.id}`} className="no-underline">
										{wait.book.title} · {wait.place}. miesto
									</Link>
									<WaitCancel reservationId={wait.id} />
								</li>
							))}
						</ul>
					</section>
				) : null}
				{data.history.length ? (
					<section className="relative z-[1] mt-10">
						<div className="flex items-center justify-between">
							<h2 className="font-display text-2xl">Vrátené</h2>
							<HistoryClear />
						</div>
						<ul className="mt-4 grid gap-2">
							{data.history.map((item) => (
								<li key={item.id}>
									<Link href={`/books/${item.book.id}`} className="no-underline">
										{item.book.title}
									</Link>
								</li>
							))}
						</ul>
					</section>
				) : null}
			</article>
		</section>
	);
}
