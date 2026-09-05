'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { HallSplash } from './HallSplash';

function isDeskHop(href: string) {
	try {
		const next = new URL(href, window.location.origin);
		if (next.origin !== window.location.origin) return false;
		if (
			next.hash &&
			next.pathname === window.location.pathname &&
			next.search === window.location.search
		) {
			return false;
		}
		return next.pathname !== window.location.pathname || next.search !== window.location.search;
	} catch {
		return false;
	}
}

export function FolioNavGate({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const search = useSearchParams();
	const [pending, setPending] = useState(false);
	const key = `${pathname}?${search}`;

	useEffect(() => {
		setPending(false);
	}, [key]);

	useEffect(() => {
		function onClick(event: MouseEvent) {
			if (event.defaultPrevented || event.button !== 0) return;
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const node = (event.target as HTMLElement | null)?.closest('a[href]');
			if (!(node instanceof HTMLAnchorElement)) return;
			if (node.target && node.target !== '_self') return;
			const href = node.getAttribute('href');
			if (!href || !isDeskHop(href)) return;
			setPending(true);
		}

		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	}, []);

	return (
		<>
			{pending ? <HallSplash copy="Listujem." /> : null}
			{children}
		</>
	);
}
