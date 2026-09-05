import type { ReactNode } from 'react';
import type { CatalogSearchItem } from '@/catalog/search';
import type { Reader } from '@/types';
import { Footer } from './Footer';
import { HallChromeNav } from './HallChromeNav';
import '@/styles/landing.css';

export function HallChrome({
	user,
	admin = false,
	path = '/',
	searchPreview,
	children
}: {
	user: Reader;
	admin?: boolean;
	path?: string;
	searchPreview: CatalogSearchItem[];
	children: ReactNode;
}) {
	return (
		<div className="landing">
			<div className="landing-body">
				<HallChromeNav user={user} admin={admin} path={path} searchPreview={searchPreview} />
				<div className="landing-main folio-sheet">
					{children}
					<Footer tone="hall" />
				</div>
			</div>
		</div>
	);
}
