import { notFound } from 'next/navigation';
import { pageMeta } from '@/utils/metadata';
import {
	borrowBook,
	getActiveLoan,
	getBook,
	getLastBorrower,
	countActiveLoans,
	MAX_ACTIVE_LOANS,
	relatedBookSlips
} from '@/server/library';
import { bookHoldUserId, getOpenHold, reserveBook } from '@/server/waitlist';
import { queueHoldNotice } from '@/server/hold-mail';
import { hasBorrowErrors, normalizeClass, parseLoanDays, splitReaderName, validateBorrow } from '@/desk/borrow-fields';
import { copiesLabel, shortDate } from '@/utils/format';
import { noticeHref } from '@/notify/notices';
import { queueLoanNotice } from '@/server/loan-mail';
import { getSessionReader } from '@/server/session';
import { BookCover } from '@/components/BookCover';
import { CatalogSlip } from '@/components/CatalogSlip';
import { BorrowDialog } from '@/components/BorrowDialog';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const book = await getBook(id);
	if (!book) return pageMeta({ title: 'Karta chýba', description: 'Zväzok v katalógu nie je.', index: false });
	return pageMeta({ title: book.title, description: book.description, type: 'book' });
}

async function borrowAction(formData: FormData) {
	'use server';
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const id = String(formData.get('bookId') ?? '');
	const values = {
		firstName: formData.get('firstName')?.toString() ?? '',
		lastName: formData.get('lastName')?.toString() ?? '',
		className: formData.get('className')?.toString() ?? '',
		days: formData.get('days')?.toString() ?? ''
	};
	if (!id) redirect('/books');
	const errors = validateBorrow(values);
	if (hasBorrowErrors(errors)) redirect(noticeHref(`/books/${id}`, 'borrow-fail'));
	const days = parseLoanDays(values.days);
	if (!days) redirect(noticeHref(`/books/${id}`, 'borrow-fail'));
	const result = await borrowBook(user.id, id, {
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		className: normalizeClass(values.className),
		days
	});
	if (!result.ok) redirect(noticeHref(`/books/${id}`, 'borrow-fail'));
	const held = await getBook(id);
	await queueLoanNotice({
		kind: 'borrow',
		to: user.email,
		readerName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim() || user.name,
		bookTitle: held?.title ?? 'Zväzok',
		callNumber: held?.callNumber,
		dueAt: result.dueAt,
		className: normalizeClass(values.className),
		days
	});
	redirect(noticeHref(`/books/${id}`, 'borrow'));
}

async function reserveAction(formData: FormData) {
	'use server';
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const id = String(formData.get('bookId') ?? '');
	if (!id) redirect('/books');
	const result = await reserveBook(user.id, id);
	if (!result.ok) redirect(noticeHref(`/books/${id}`, 'hold-fail'));
	const held = await getBook(id);
	await queueHoldNotice({
		kind: 'queued',
		to: user.email,
		readerName: user.name,
		bookTitle: held?.title ?? 'Zväzok',
		callNumber: held?.callNumber,
		place: result.place
	});
	redirect(noticeHref(`/books/${id}`, 'hold'));
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const current = await getBook(id);
	if (!current) notFound();
	const user = await getSessionReader();
	const [userLoan, activeCount, lastBorrower, related, wait, holdUserId] = await Promise.all([
		user ? getActiveLoan(user.id, current.id) : null,
		user ? countActiveLoans(user.id) : 0,
		user ? getLastBorrower(user.id) : null,
		relatedBookSlips(current.id, current.category.id),
		user ? getOpenHold(user.id, current.id) : null,
		bookHoldUserId(current.id)
	]);
	const fromName = user ? splitReaderName(user.name) : { firstName: '', lastName: '' };
	const borrower = lastBorrower ?? {
		firstName: fromName.firstName,
		lastName: fromName.lastName,
		className: '',
		days: 21
	};
	const available = current.copiesAvailable > 0;
	const atLimit = MAX_ACTIVE_LOANS != null && activeCount >= MAX_ACTIVE_LOANS;

	return (
		<article>
			<p className="text-muted-foreground text-sm">
				<a href="/books" className="no-underline hover:underline">
					Katalóg
				</a>
				{' · '}
				<a href={`/departments/${current.category.slug}`} className="no-underline hover:underline">
					{current.category.name}
				</a>
			</p>
			<div className="mt-8 grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)]">
				<BookCover book={current} size="hero" linked={false} />
				<div>
					<p className="font-mono text-[0.72rem] tracking-[0.16em] uppercase text-muted-foreground">
						{current.category.code} · {current.callNumber}
					</p>
					<h1 className="font-display mt-2 text-[clamp(2rem,6vw,3.4rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
						{current.title}
					</h1>
					<p className="mt-3 text-lg">{current.authors.map((person) => person.name).join(' · ')}</p>
					<p className="text-muted-foreground mt-4 max-w-[52ch] leading-relaxed">{current.description}</p>
					<p className="mt-6 font-sans text-sm font-semibold uppercase tracking-wide">
						{copiesLabel(current.copiesAvailable, current.copiesTotal)}
					</p>
					{userLoan ? (
						<p className="mt-4">Máš tento zväzok do {shortDate(userLoan.dueAt)}.</p>
					) : wait ? (
						<p className="mt-4">Čakáš v rade.</p>
					) : available && user && !atLimit ? (
						<BorrowDialog
							bookId={current.id}
							title={current.title}
							callNumber={current.callNumber}
							borrower={borrower}
							action={borrowAction}
						/>
					) : !available && user ? (
						<form action={reserveAction} className="mt-8">
							<input type="hidden" name="bookId" value={current.id} />
							<button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground">
								Zaradiť do radu
							</button>
						</form>
					) : !user ? (
						<p className="mt-6">
							<a href="/login" className="underline">
								Prihlás sa
							</a>
							, potom si zväzok požičiaš.
						</p>
					) : null}
				</div>
			</div>
			{related.length ? (
				<section className="mt-16">
					<h2 className="font-display text-2xl">Ďalšie z police</h2>
					<div className="mt-4">
						{related.map((book) => (
							<CatalogSlip key={book.id} book={book} />
						))}
					</div>
				</section>
			) : null}
		</article>
	);
}
