import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { RESERVATION_STATUSES, reservationLabel, toDatetimeLocal } from '@/desk/admin';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { bookOptions, readerOptions } from '@/server/desk/options';
import { getDeskReservation, listDeskReservations } from '@/server/desk/reservations';
import { deleteReservationAction, saveReservationAction } from './actions';

export const metadata = pageMeta({
	title: 'Rezervácie',
	description: 'Čakací rad a lístky na pulte.',
	index: false
});

export default async function AdminReservationsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const [rows, books, readers] = await Promise.all([
		listDeskReservations(q),
		bookOptions(),
		readerOptions()
	]);
	const current = await pickCurrent(rows, edit, getDeskReservation);
	const here = new URL('http://local/admin/reservations');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">08 rezervácie</p>
			<div className="pult-toolbar">
				<PultSearch
					query={q}
					placeholder="názov, meno, stav"
					path="/admin/reservations"
					edit={edit}
				/>
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="Žiadna rezervácia."
					columns={[
						{
							id: 'book',
							header: 'Zväzok',
							cell: (row) => ({ title: row.bookTitle, hint: row.readerName })
						},
						{
							id: 'status',
							header: 'Stav',
							cell: (row) => ({
								stamp: reservationLabel(row.status),
								desk: row.status === 'fulfilled'
							})
						}
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteReservationAction}
								fields={{ id: row.id, q }}
								ask="Zmazať rezerváciu?"
							/>
						</>
					)}
				/>
				<form className="pult-form" action={saveReservationAction} key={current?.id ?? 'new'}>
					<input type="hidden" name="q" value={q} />
					<input type="hidden" name="id" value={current?.id ?? ''} />
					<h2>{current ? 'Opraviť rezerváciu' : 'Nová rezervácia'}</h2>
					<div className="pult-fields is-2">
						<label className="pult-field is-wide">
							<span>Zväzok</span>
							<select name="bookId" required defaultValue={current?.bookId ?? ''}>
								<option value="">—</option>
								{books.map((book) => (
									<option key={book.id} value={book.id}>
										{book.title}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field is-wide">
							<span>Čitateľ</span>
							<select name="userId" required defaultValue={current?.userId ?? ''}>
								<option value="">—</option>
								{readers.map((reader) => (
									<option key={reader.id} value={reader.id}>
										{reader.name}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Stav</span>
							<select name="status" required defaultValue={current?.status ?? 'pending'}>
								{RESERVATION_STATUSES.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Expirácia</span>
							<input
								name="expiresAt"
								type="datetime-local"
								defaultValue={toDatetimeLocal(current?.expiresAt)}
							/>
						</label>
					</div>
					<div className="pult-submit">
						<button type="submit">{current ? 'Uložiť' : 'Založiť'}</button>
						{current ? (
							<Link className="pult-ghost" href={pultHref(here, { edit: null })}>
								Zrušiť
							</Link>
						) : null}
					</div>
				</form>
			</div>
		</>
	);
}
