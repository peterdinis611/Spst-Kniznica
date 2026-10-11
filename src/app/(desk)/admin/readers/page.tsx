import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { DESK_ROLES, parseRole, ROLE_LABELS } from '@/auth/ability';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { readerNumber, shortDate } from '@/utils/format';
import { getDeskReader, listDeskReaders } from '@/server/desk/readers';
import { deleteReaderAction, rollYearAction, saveReaderAction } from './actions';

export const metadata = pageMeta({
	title: 'Čitatelia',
	description: 'Preukazy, pečiatky rolí a september.',
	index: false
});

export default async function AdminReadersPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const rows = await listDeskReaders(q);
	const current = await pickCurrent(rows, edit, getDeskReader);
	const here = new URL('http://local/admin/readers');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">09 čitatelia</p>
			<div className="pult-toolbar">
				<PultSearch query={q} placeholder="meno alebo e-mail" path="/admin/readers" edit={edit} />
				<form action={rollYearAction}>
					<button type="submit">Posunúť ročníky</button>
				</form>
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<p className="pult-lede">
				Nový preukaz vzniká registráciou. Tu opravíš meno, e-mail, triedu a rolu — heslo ostáva v
				Supabase. <strong>Posunúť ročníky</strong> posunie I.A → II.A; učiteľov nechá.
			</p>
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="Žiadny preukaz."
					columns={[
						{
							id: 'name',
							header: 'Čitateľ',
							cell: (row) => ({ title: row.name, hint: row.email })
						},
						{
							id: 'pass',
							header: 'Preukaz',
							cell: (row) => readerNumber(row.id)
						},
						{
							id: 'role',
							header: 'Rola',
							cell: (row) => {
								const role = parseRole(row.role);
								return { stamp: ROLE_LABELS[role], desk: role !== 'reader' };
							}
						},
						{ id: 'class', header: 'Trieda', cell: (row) => row.className || '—' },
						{ id: 'loans', header: 'Lístky', cell: (row) => row.loanCount }
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteReaderAction}
								fields={{ id: row.id, q }}
								ask={`Zmazať preukaz ${row.name}?`}
							/>
						</>
					)}
				/>
				{current ? (
					<form className="pult-form" action={saveReaderAction} key={current.id}>
						<input type="hidden" name="q" value={q} />
						<input type="hidden" name="id" value={current.id} />
						<h2>Opraviť preukaz</h2>
						<div className="pult-fields is-2">
							<label className="pult-field">
								<span>Meno</span>
								<input name="name" required defaultValue={current.name} />
							</label>
							<label className="pult-field">
								<span>E-mail</span>
								<input name="email" type="email" required defaultValue={current.email} />
							</label>
							<label className="pult-field">
								<span>Rola</span>
								<select name="role" defaultValue={parseRole(current.role)}>
									{DESK_ROLES.map((role) => (
										<option key={role.value} value={role.value}>
											{role.label}
										</option>
									))}
								</select>
							</label>
							<label className="pult-field">
								<span>Trieda</span>
								<input name="className" defaultValue={current.className ?? ''} placeholder="II.A" />
							</label>
						</div>
						<p className="pult-count">založený {shortDate(current.createdAt)}</p>
						<div className="pult-submit">
							<button type="submit">Uložiť</button>
							<Link className="pult-ghost" href={pultHref(here, { edit: null })}>
								Zrušiť
							</Link>
						</div>
					</form>
				) : (
					<p className="pult-empty">Vyber preukaz vľavo.</p>
				)}
			</div>
		</>
	);
}
