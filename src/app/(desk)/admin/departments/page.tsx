import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { getDeskCategory, listDeskCategories } from '@/server/desk/categories';
import { deleteDepartment, saveDepartment } from './actions';

export const metadata = pageMeta({
	title: 'Odbory',
	description: 'CRUD odborov školského fondu.',
	index: false
});

export default async function AdminDepartmentsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const rows = await listDeskCategories(q);
	const current = await pickCurrent(rows, edit, getDeskCategory);
	const here = new URL('http://local/admin/departments');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">02 odbory</p>
			<div className="pult-toolbar">
				<PultSearch
					query={q}
					placeholder="názov, slug, kód"
					path="/admin/departments"
					edit={edit}
				/>
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="V tejto zásuvke nie je odbor. Založ lístok vpravo."
					columns={[
						{
							id: 'name',
							header: 'Odbor',
							cell: (row) => ({ title: row.name, hint: row.slug })
						},
						{ id: 'code', header: 'Kód', cell: (row) => row.code },
						{ id: 'bookCount', header: 'Knihy', cell: (row) => row.bookCount }
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteDepartment}
								fields={{ id: row.id, q }}
								ask={`Zmazať odbor ${row.name}?`}
							/>
						</>
					)}
				/>
				<form className="pult-form" action={saveDepartment}>
					<input type="hidden" name="q" value={q} />
					<input type="hidden" name="id" value={current?.id ?? ''} />
					<h2>{current ? 'Opraviť odbor' : 'Nový odbor'}</h2>
					<div className="pult-fields is-2">
						<label className="pult-field">
							<span>Názov</span>
							<input name="name" required defaultValue={current?.name ?? ''} />
						</label>
						<label className="pult-field">
							<span>Slug</span>
							<input name="slug" defaultValue={current?.slug ?? ''} placeholder="z názvu" />
						</label>
						<label className="pult-field">
							<span>Kód</span>
							<input name="code" required maxLength={8} defaultValue={current?.code ?? ''} />
						</label>
						<label className="pult-field">
							<span>Poradie</span>
							<input name="sortOrder" type="number" defaultValue={current?.sortOrder ?? 0} />
						</label>
						<label className="pult-field">
							<span>Farba</span>
							<input name="accent" type="color" defaultValue={current?.accent ?? '#3c2a21'} />
						</label>
						<label className="pult-field is-wide">
							<span>Popis</span>
							<textarea name="description" required defaultValue={current?.description ?? ''} />
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
