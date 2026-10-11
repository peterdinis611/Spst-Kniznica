import { FolioLink as Link } from '@/components/FolioLink';

export function PultSearch({
	query,
	placeholder,
	path,
	edit
}: {
	query: string;
	placeholder: string;
	path: string;
	edit?: string;
}) {
	return (
		<form className="pult-search" method="GET" action={path}>
			{edit ? <input type="hidden" name="edit" value={edit} /> : null}
			<label>
				<span>Hľadať</span>
				<input name="q" defaultValue={query} placeholder={placeholder} autoComplete="off" />
			</label>
			<button type="submit">Hľadať</button>
			{query ? (
				<Link
					className="pult-ghost"
					href={edit ? `${path}?edit=${encodeURIComponent(edit)}` : path}
				>
					Vymazať
				</Link>
			) : null}
		</form>
	);
}
