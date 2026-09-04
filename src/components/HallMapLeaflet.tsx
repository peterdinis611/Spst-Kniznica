'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const HallMapCanvas = dynamic(
	() => import('./HallMapCanvas').then((mod) => ({ default: mod.HallMapCanvas })),
	{
		ssr: false,
		loading: () => <div className="hall-map-leaflet" aria-hidden />
	}
);

export function HallMapLeaflet() {
	const host = useRef<HTMLDivElement>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const node = host.current;
		if (!node || ready) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				setReady(true);
				observer.disconnect();
			},
			{ rootMargin: '240px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [ready]);

	if (!ready) return <div ref={host} className="hall-map-leaflet" aria-hidden />;
	return <HallMapCanvas />;
}
