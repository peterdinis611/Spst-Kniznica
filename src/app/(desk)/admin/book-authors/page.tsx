import { PultBlot } from '@/components/pult/PultBlot';
import { PultDelete } from '@/components/pult/PultDelete';
import { PultLedger } from '@/components/pult/PultLedger';
import { PultSearch } from '@/components/pult/PultSearch';
import { pageMeta } from '@/utils/metadata';
import { listDeskLinks } from '@/server/desk/links';
import { authorOptions, bookOptions } from '@/server/desk/options';
import { deleteLinkAction, saveLinkAction } from './actions';

export const metadata = pageMeta({
	title: 'Väzby',
	description: 'Väzba zväzok ↔ autor.',
	index: false
});

export default async function AdminBookAuthorsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; stamp?: string; fault?: string }>;
}) {
	const { q = '', stamp, fault } = await searchParams;
	const [raw, books, authors] = await Promise.all([
		listDeskLinks(q),
		bookOptions(),
		authorOptions()
	]);
	const rows = raw.map((row) => ({
		...row,
		id: `${row.bookId}::${row.authorId}`
	}));

	return (
		<>
			<p className="pult-queue-kicker">05 väzby</p>
			<div className="pult-toolbar">
				<PultSearch query={q} placeholder="zväzok alebo autor" path="/admin/book-authors" />
			</div>
			<PultBlot stamp={stamp} fault={fault} />
			<div className="pult-grid is-split">
				<PultLedger
					rows={rows}
					empty="Žiadna väzba."
					columns={[
						{
							id: 'book',
							header: 'Zväzok',
							cell: (row) => ({ title: row.bookTitle, hint: `pozícia ${row.position}` })
						},
						{ id: 'author', header: 'Autor', cell: (row) => row.authorName }
					]}
					actions={(row) => (
						<PultDelete
							action={deleteLinkAction}
							fields={{ bookId: row.bookId, authorId: row.authorId, q }}
							ask={`Zmazať väzbu ${row.bookTitle}?`}
						/>
					)}
				/>
				<form className="pult-form" action={saveLinkAction}>
					<input type="hidden" name="q" value={q} />
					<h2>Nová väzba</h2>
					<div className="pult-fields is-2">
						<label className="pult-field is-wide">
							<span>Zväzok</span>
							<select name="bookId" required defaultValue="">
								<option value="">—</option>
								{books.map((book) => (
									<option key={book.id} value={book.id}>
										{book.title}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field is-wide">
							<span>Autor</span>
							<select name="authorId" required defaultValue="">
								<option value="">—</option>
								{authors.map((author) => (
									<option key={author.id} value={author.id}>
										{author.name}
									</option>
								))}
							</select>
						</label>
						<label className="pult-field">
							<span>Poradie</span>
							<input name="position" type="number" defaultValue={0} />
						</label>
					</div>
					<div className="pult-submit">
						<button type="submit">Založiť</button>
					</div>
				</form>
			</div>
		</>
	);
}
