'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './wait-stamp.css';

export function WaitStamp() {
	const pathname = usePathname();
	const search = useSearchParams();
	const [visible, setVisible] = useState(false);
	const first = useRef(true);

	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		setVisible(true);
		const id = setTimeout(() => setVisible(false), 420);
		return () => clearTimeout(id);
	}, [pathname, search]);

	if (!visible) return null;

	return (
		<div className="wait" role="status" aria-live="polite" aria-busy="true">
			<p className="sr-only">Listujem fond</p>
			<div className="wait-blotter" aria-hidden="true">
				<div className="wait-orbit">
					{[0, 1, 2, 3, 4, 5, 6, 7].map((hole) => (
						<span key={hole} style={{ ['--i' as string]: hole }} />
					))}
				</div>
				<p className="wait-stamp">SPŠT</p>
			</div>
			<p className="wait-copy" aria-hidden="true">
				Listujem.
			</p>
		</div>
	);
}
