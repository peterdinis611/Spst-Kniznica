'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './scroll-to-top.css';

export function ScrollToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		function onScroll() {
			setVisible(window.scrollY > 420);
		}
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	if (!visible) return null;

	return (
		<button
			type="button"
			className="to-top"
			aria-label="Späť hore"
			onClick={() => {
				const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
			}}
		>
			<ArrowUp className="size-4" />
		</button>
	);
}
