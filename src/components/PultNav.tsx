import Link from 'next/link';
import { pultTablesFor } from '@/desk/admin';

export function PultNav({ manage = true, pathname }: { manage?: boolean; pathname: string }) {
	const tabs = pultTablesFor(manage);

	function on(path: string) {
		if (path === '/admin') return pathname === '/admin' || pathname === '/admin/';
		return pathname.startsWith(path);
	}

	return (
		<nav className="pult-tabs" aria-label="Kartotéka pultu">
			{tabs.map((item, i) => (
				<Link
					key={item.href}
					className={`pult-tab${on(item.href) ? ' is-on' : ''}`}
					href={item.href}
					prefetch
					style={{ animationDelay: `${i * 40}ms` }}
				>
					<em>{item.code}</em>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
