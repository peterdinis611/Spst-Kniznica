import { FolioLink as Link } from '@/components/FolioLink';
import { PultBlot } from '@/components/pult/PultBlot';
import { PultCover } from '@/components/pult/PultCover';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { env } from '@/config/env';
import { pickCurrent, pultHref } from '@/desk/pult-ledger';
import { pageMeta } from '@/utils/metadata';
import { bookAuthorIds, getDeskBook, listDeskBooks } from '@/server/desk/books';
import { authorOptions, categoryOptions } from '@/server/desk/options';
import { deleteBookAction, saveBookAction } from './actions';

export const metadata = pageMeta({
	title: 'Knihy',
	description: 'CRUD zväzkov školského fondu.',
	index: false
});

export default async function AdminBooksPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; edit?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', edit = '', stamp, fault } = await searchParams;
	const [rows, categories, authors] = await Promise.all([
		listDeskBooks(q),
		categoryOptions(),
		authorOptions()
	]);
	const current = await pickCurrent(rows, edit, getDeskBook);
	const linked = current ? await bookAuthorIds(current.id) : [];
	const linkedIds = new Set(linked.map((item) => item.authorId));
	const uploadReady = Boolean(env.UPLOADTHING_TOKEN?.trim());
	const here = new URL('http://local/admin/books');
	if (q) here.searchParams.set('q', q);
	if (edit) here.searchParams.set('edit', edit);

	return (
		<>
			<p className="pult-queue-kicker">04 knihy</p>
			<div className="pult-toolbar">
				<PultSearch
					query={q}
					placeholder="názov, ISBN, signatúra"
					path="/admin/books"
					edit={edit}
				/>
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="V tejto zásuvke nie je zväzok."
					columns={[
						{
							id: 'title',
							header: 'Zväzok',
							cell: (row) => ({ title: row.title, hint: row.callNumber })
						},
						{ id: 'isbn', header: 'ISBN', cell: (row) => row.isbn },
						{
							id: 'copies',
							header: 'Kusy',
							cell: (row) => `${row.copiesAvailable}/${row.copiesTotal}`
						}
					]}
					actions={(row) => (
						<>
							<Link className="pult-ghost" href={pultHref(here, { edit: row.id })}>
								Upraviť
							</Link>
							<PultDelete
								action={deleteBookAction}
								fields={{ id: row.id, q }}
								ask={`Zmazať ${row.title}?`}
							/>
						</>
					)}
				/>
				<form className="pult-form" action={saveBookAction} key={current?.id ?? 'new'}>
					<input type="hidden" name="q" value={q} />
					<input type="hidden" name="id" value={current?.id ?? ''} />
					<h2>{current ? 'Opraviť zväzok' : 'Nový zväzok'}</h2>
					<div className="pult-fields is-2">
						<label className="pult-field is-wide">
							<span>Názov</span>
							<input name="title" required defaultValue={current?.title ?? ''} />
						</label>
						<label className="pult-field is-wide">
							<span>Podtitul</span>
							<input name="subtitle" defaultValue={current?.subtitle ?? ''} />
						</label>
						<label className="pult-field">
							<span>ISBN</span>
							<input name="isbn" required defaultValue={current?.isbn ?? ''} />
						</label>
						<label className="pult-field">
							<span>Signatúra</span>
							<input name="callNumber" required defaultValue={current?.callNumber ?? ''} />
						</label>
						<label className="pult-field">
							<span>Rok</span>
							<input
								name="year"
								type="number"
								required
								defaultValue={current?.year ?? new Date().getFullYear()}
							/>
						</label>
						<label className="pult-field">
							<span>Strany</span>
							<input name="pages" type="number" required defaultValue={current?.pages ?? 1} />
						</label>
						<label className="pult-field">
							<span>Odbor</span>
							<select name="categoryId" required defaultValue={current?.categoryId ?? ''}>
								<option value="">—</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Vydavateľ</span>
							<input name="publisher" required defaultValue={current?.publisher ?? ''} />
						</label>
						<label className="pult-field">
							<span>Jazyk</span>
							<input name="language" defaultValue={current?.language ?? 'sk'} />
						</label>
						{current ? null : (
							<label className="pult-field">
								<span>Výtlačky</span>
								<input name="copies" type="number" min={0} max={40} defaultValue={1} />
							</label>
						)}
						<label className="pult-field">
							<span>Na police</span>
							<input
								name="featured"
								type="checkbox"
								value="1"
								defaultChecked={current?.featured ?? false}
							/>
						</label>
						<label className="pult-field is-wide">
							<span>Autori</span>
							<select name="authorIds" multiple size={6} defaultValue={[...linkedIds]}>
								{authors.map((author) => (
									<option key={author.id} value={author.id}>
										{author.name}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field is-wide">
							<span>Anotácia</span>
							<textarea name="description" required defaultValue={current?.description ?? ''} />
						</label>
						<div className="pult-field is-wide">
							<span>Obálka</span>
							<PultCover
								coverUrl={current?.coverUrl ?? ''}
								coverKey={current?.coverKey ?? ''}
								ready={uploadReady}
							/>
						</div>
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
