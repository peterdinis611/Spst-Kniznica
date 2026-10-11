import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { toDatetimeLocal } from '@/desk/admin';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { canOperateDesk } from '@/server/admin-access';
import { getDeskLoan, listDeskLoans } from '@/server/desk/loans';
import { bookOptions, readerOptions } from '@/server/desk/options';
import { getSessionReader } from '@/server/session';
import { pageMeta } from '@/utils/metadata';
import { stampDate } from '@/utils/format';
import { deleteLoanAction, returnLoanAction, saveLoanAction } from './actions';

export const metadata = pageMeta({
	title: 'Výpožičky',
	description: 'Lístky fondu — výpožička a vrátenie z pultu.',
	index: false
});

export default async function AdminLoansPage({
	searchParams
}: {
	searchParams: Promise<{
		q?: string;
		edit?: string;
		stamp?: string;
		fault?: string;
		class?: string;
	}>;
}) {
	const user = await getSessionReader();
	const manage = canOperateDesk(user);
	const { q = '', edit = '', stamp, fault, class: klass = '' } = await searchParams;
	const rows = await listDeskLoans({ q, klass, open: false });
	const current = await pickCurrent(rows, edit, getDeskLoan);
	const [books, readers] = manage ? await Promise.all([bookOptions(), readerOptions()]) : [[], []];
	const here = new URL('http://local/admin/loans');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);
	if (klass) here.searchParams.set('class', klass);

	return (
		<>
			<p className="pult-queue-kicker">07 výpožičky</p>
			<div className="pult-toolbar">
				<PultSearch query={q} placeholder="názov, meno, trieda" path="/admin/loans" edit={edit} />
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			{manage ? null : (
				<p className="pult-lede">
					Trieda vonku — lístky čítaš. Zmenu pečiatkuje knihovník, alebo Predĺžiť / Stiahnuť na
					Prehľade.
				</p>
			)}
			<div className={`pult-grid${manage ? ' is-split' : ''}`}>
				<PultLedger
					rows={rows}
					empty="Žiadny lístok."
					columns={[
						{
							id: 'book',
							header: 'Zväzok',
							cell: (row) => ({
								title: row.bookTitle,
								hint: `${row.borrowerFirstName} ${row.borrowerLastName}`.trim()
							})
						},
						{ id: 'class', header: 'Trieda', cell: (row) => row.borrowerClass || '—' },
						{
							id: 'due',
							header: 'Lehota',
							cell: (row) => ({
								stamp: stampDate(row.dueAt),
								desk: !row.returnedAt && row.dueAt < new Date()
							})
						}
					]}
					actions={
						manage
							? (row) => (
									<>
										<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
											Upraviť
										</Link>
										{row.returnedAt ? null : (
											<form action={returnLoanAction}>
												<input type="hidden" name="id" value={row.id} />
												<input type="hidden" name="q" value={q} />
												<button type="submit" className="pult-ghost">
													Vrátiť
												</button>
											</form>
										)}
										<PultDelete
											action={deleteLoanAction}
											fields={{ id: row.id, q }}
											ask="Zmazať lístok?"
										/>
									</>
								)
							: undefined
					}
				/>
				{manage ? (
					<form className="pult-form" action={saveLoanAction} key={current?.id ?? 'new'}>
						<input type="hidden" name="q" value={q} />
						<input type="hidden" name="id" value={current?.id ?? ''} />
						<input type="hidden" name="holdingId" value={current?.holdingId ?? ''} />
						{current ? (
							<>
								<input type="hidden" name="bookId" value={current.bookId} />
								<input type="hidden" name="userId" value={current.userId} />
							</>
						) : null}
						<h2>{current ? 'Opraviť lístok' : 'Nový lístok'}</h2>
						<div className="pult-fields is-2">
							<label className="pult-field is-wide">
								<span>Zväzok</span>
								{current ? (
									<p className="pult-count">{current.bookTitle}</p>
								) : (
									<select name="bookId" required defaultValue="">
										<option value="">—</option>
										{books.map((book) => (
											<option key={book.id} value={book.id}>
												{book.title}
											</option>
										))}
									</select>
								)}
							</label>
							<label className="pult-field is-wide">
								<span>Čitateľ</span>
								{current ? (
									<p className="pult-count">{current.readerName}</p>
								) : (
									<select name="userId" required defaultValue="">
										<option value="">—</option>
										{readers.map((reader) => (
											<option key={reader.id} value={reader.id}>
												{reader.name}
											</option>
										))}
									</select>
								)}
							</label>
							<label className="pult-field">
								<span>Meno</span>
								<input
									name="borrowerFirstName"
									required
									defaultValue={current?.borrowerFirstName ?? ''}
								/>
							</label>
							<label className="pult-field">
								<span>Priezvisko</span>
								<input
									name="borrowerLastName"
									required
									defaultValue={current?.borrowerLastName ?? ''}
								/>
							</label>
							<label className="pult-field">
								<span>Trieda</span>
								<input name="borrowerClass" defaultValue={current?.borrowerClass ?? ''} />
							</label>
							<label className="pult-field">
								<span>Dni</span>
								<input
									name="loanDays"
									type="number"
									required
									defaultValue={current?.loanDays ?? 21}
								/>
							</label>
							{current ? (
								<>
									<label className="pult-field">
										<span>Požičané</span>
										<input
											name="borrowedAt"
											type="datetime-local"
											defaultValue={toDatetimeLocal(current.borrowedAt)}
										/>
									</label>
									<label className="pult-field">
										<span>Lehota</span>
										<input
											name="dueAt"
											type="datetime-local"
											defaultValue={toDatetimeLocal(current.dueAt)}
										/>
									</label>
								</>
							) : null}
						</div>
						<div className="pult-submit">
							<button type="submit">{current ? 'Uložiť' : 'Vypožičať'}</button>
							{current ? (
								<Link className="pult-ghost" href={pultHref(here, { edit: null })}>
									Zrušiť
								</Link>
							) : null}
						</div>
					</form>
				) : null}
			</div>
		</>
	);
}
