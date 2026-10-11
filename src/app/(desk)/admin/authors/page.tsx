import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { getDeskAuthor, listDeskAuthors } from '@/server/desk/authors';
import { deleteAuthorAction, saveAuthorAction } from './actions';

export const metadata = pageMeta({
	title: 'Autori',
	description: 'CRUD autorov školského fondu.',
	index: false
});

export default async function AdminAuthorsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const rows = await listDeskAuthors(q);
	const current = await pickCurrent(rows, edit, getDeskAuthor);
	const here = new URL('http://local/admin/authors');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">03 autori</p>
			<div className="pult-toolbar">
				<PultSearch query={q} placeholder="meno, slug, rola" path="/admin/authors" edit={edit} />
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="V tejto zásuvke nie je autor."
					columns={[
						{
							id: 'name',
							header: 'Autor',
							cell: (row) => ({ title: row.name, hint: row.slug })
						},
						{ id: 'role', header: 'Rola', cell: (row) => row.role },
						{ id: 'bookCount', header: 'Knihy', cell: (row) => row.bookCount }
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteAuthorAction}
								fields={{ id: row.id, q }}
								ask={`Zmazať autora ${row.name}?`}
							/>
						</>
					)}
				/>
				<form className="pult-form" action={saveAuthorAction}>
					<input type="hidden" name="q" value={q} />
					<input type="hidden" name="id" value={current?.id ?? ''} />
					<h2>{current ? 'Opraviť autora' : 'Nový autor'}</h2>
					<div className="pult-fields is-2">
						<label className="pult-field">
							<span>Meno</span>
							<input name="name" required defaultValue={current?.name ?? ''} />
						</label>
						<label className="pult-field">
							<span>Slug</span>
							<input name="slug" defaultValue={current?.slug ?? ''} placeholder="z mena" />
						</label>
						<label className="pult-field">
							<span>Rola</span>
							<input name="role" required defaultValue={current?.role ?? 'autor'} />
						</label>
						<label className="pult-field">
							<span>Život</span>
							<input
								name="lifespan"
								defaultValue={current?.lifespan ?? ''}
								placeholder="1900–1980"
							/>
						</label>
						<label className="pult-field is-wide">
							<span>Bio</span>
							<textarea name="bio" required defaultValue={current?.bio ?? ''} />
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
