import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { HOLDING_STATUSES, holdingLabel, toDatetimeLocal } from '@/desk/admin';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { getDeskHolding, listDeskHoldings } from '@/server/desk/holdings';
import { bookOptions } from '@/server/desk/options';
import { deleteHoldingAction, saveHoldingAction } from './actions';

export const metadata = pageMeta({
	title: 'Výtlačky',
	description: 'Inventár výtlačkov školského fondu.',
	index: false
});

export default async function AdminHoldingsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const [rows, books] = await Promise.all([listDeskHoldings(q), bookOptions()]);
	const current = await pickCurrent(rows, edit, getDeskHolding);
	const here = new URL('http://local/admin/holdings');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">06 výtlačky</p>
			<div className="pult-toolbar">
				<PultSearch
					query={q}
					placeholder="inventár, názov, stav"
					path="/admin/holdings"
					edit={edit}
				/>
				<Link className="pult-ghost" href="/admin/holdings/labels">
					Štítky na chrbát
				</Link>
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="V tejto zásuvke nie je výtlačok."
					columns={[
						{
							id: 'inventory',
							header: 'Inventár',
							cell: (row) => ({ title: row.inventoryNo, hint: row.bookTitle })
						},
						{
							id: 'status',
							header: 'Stav',
							cell: (row) => ({
								stamp: holdingLabel(row.status),
								desk: row.status === 'loaned'
							})
						}
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteHoldingAction}
								fields={{ id: row.id, q }}
								ask={`Zmazať ${row.inventoryNo}?`}
							/>
						</>
					)}
				/>
				<form className="pult-form" action={saveHoldingAction} key={current?.id ?? 'new'}>
					<input type="hidden" name="q" value={q} />
					<input type="hidden" name="id" value={current?.id ?? ''} />
					<h2>{current ? 'Opraviť výtlačok' : 'Nový výtlačok'}</h2>
					<div className="pult-fields is-2">
						<label className="pult-field is-wide">
							<span>Zväzok</span>
							<select name="bookId" required defaultValue={current?.bookId ?? ''}>
								<option value="">—</option>
								{books.map((book) => (
									<option key={book.id} value={book.id}>
										{book.title} · {book.callNumber}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Inventár</span>
							<input name="inventoryNo" required defaultValue={current?.inventoryNo ?? ''} />
						</label>
						<label className="pult-field">
							<span>Stav</span>
							<select name="status" required defaultValue={current?.status ?? 'available'}>
								{HOLDING_STATUSES.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Nadobudnuté</span>
							<input
								name="acquiredAt"
								type="datetime-local"
								defaultValue={toDatetimeLocal(current?.acquiredAt)}
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
