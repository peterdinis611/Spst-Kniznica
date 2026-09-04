import { pageMeta } from '@/utils/metadata';
import { authorLine, dueStatus, firstName, loanedLabel, readerNumber } from '@/utils/format';
import { BookCover } from '@/components/BookCover';
import { loadLoans, returnLoan, renewLoanAction, cancelWait, clearHistory } from './actions';
import '@/components/loans-folio.css';

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
		<section className="folio">
			<div className="folio-copy">
				<p className="folio-kicker">pavilón B · lehota na lístku</p>
				<p className="folio-display">Koľko treba.</p>
				<p className="folio-lede">
					{given}, pri výpožičke vyplníš meno, triedu a dobu. Ber si toľko zväzkov, koľko potrebuješ — strop na
					preukaze nie je.
				</p>
				<ul className="folio-facts">
					<li>7–21 dní</li>
					<li>bez stropu</li>
					<li>pav. B</li>
				</ul>
			</div>
			<article className="folio-card">
				<span className="folio-spine" aria-hidden="true" />
				<header className="folio-id">
					<p className="folio-mark">výpožičný lístok</p>
					<p className="folio-serial">{serial}</p>
					<h1>{data.reader.name}</h1>
					<p>
						{loanedLabel(data.activeCount)} · {data.waits.length} v rade
					</p>
				</header>
				{data.loans.length === 0 ? (
					<p className="text-muted-foreground mt-6">Žiadny zväzok práve nie je na preukaze.</p>
				) : (
					<ul className="mt-6 grid gap-4">
						{data.loans.map((item) => {
							const due = dueStatus(item.dueAt);
							return (
								<li key={item.id} className="flex gap-4 border-t border-border pt-4">
									<BookCover book={item.book} size="thumb" />
									<div className="min-w-0">
										<p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-muted-foreground">
											{item.book.callNumber}
										</p>
										<a href={`/books/${item.book.id}`} className="font-display text-xl no-underline">
											{item.book.title}
										</a>
										<p className="text-muted-foreground text-sm">{authorLine(item.book.authors)}</p>
										<p className="mt-2 text-sm">{due.label}</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<form action={returnLoan}>
												<input type="hidden" name="loanId" value={item.id} />
												<button type="submit" className="rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground">
													Nahlásiť vrátenie
												</button>
											</form>
											{item.canRenew ? (
												<form action={renewLoanAction}>
													<input type="hidden" name="loanId" value={item.id} />
													<button type="submit" className="rounded-full px-3 py-1.5 text-sm ring-1 ring-border">
														Predĺžiť
													</button>
												</form>
											) : null}
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
				{data.waits.length ? (
					<section className="mt-10">
						<h2 className="font-display text-2xl">V rade</h2>
						<ul className="mt-4 grid gap-3">
							{data.waits.map((wait) => (
								<li key={wait.id} className="flex items-center justify-between gap-3">
									<a href={`/books/${wait.book.id}`} className="no-underline">
										{wait.book.title} · {wait.place}. miesto
									</a>
									<form action={cancelWait}>
										<input type="hidden" name="reservationId" value={wait.id} />
										<button type="submit" className="text-sm underline">
											Stiahnuť
										</button>
									</form>
								</li>
							))}
						</ul>
					</section>
				) : null}
				{data.history.length ? (
					<section className="mt-10">
						<div className="flex items-center justify-between">
							<h2 className="font-display text-2xl">Vrátené</h2>
							<form action={clearHistory}>
								<button type="submit" className="text-sm underline">
									Vyčistiť
								</button>
							</form>
						</div>
						<ul className="mt-4 grid gap-2">
							{data.history.map((item) => (
								<li key={item.id}>
									<a href={`/books/${item.book.id}`} className="no-underline">
										{item.book.title}
									</a>
								</li>
							))}
						</ul>
					</section>
				) : null}
			</article>
		</section>
	);
}
