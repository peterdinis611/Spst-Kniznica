import { FolioLink as Link } from '@/components/FolioLink';
import { registerHref } from '@/catalog/register-page';
import './folio-pager.css';

export function FolioPager({
	path,
	q,
	odbor,
	page,
	pages,
	total
}: {
	path: '/books' | '/holdings';
	q?: string;
	odbor?: string;
	page: number;
	pages: number;
	total: number;
}) {
	if (pages <= 1) return null;
	return (
		<nav className="folio-pager" aria-label="Listy registra">
			{page > 1 ? (
				<Link href={registerHref(path, { q, odbor, page: page - 1 })}>Predošlý list</Link>
			) : (
				<span />
			)}
			<p>
				List {page} z {pages}
				<em>{total.toLocaleString('sk-SK')} zväzkov</em>
			</p>
			{page < pages ? (
				<Link className="is-next" href={registerHref(path, { q, odbor, page: page + 1 })}>
					Ďalší list
				</Link>
			) : (
				<span />
			)}
		</nav>
	);
}
