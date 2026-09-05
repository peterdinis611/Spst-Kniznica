'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function OrderWait() {
	const router = useRouter();

	useEffect(() => {
		let ticks = 0;
		const id = window.setInterval(() => {
			ticks += 1;
			router.refresh();
			if (ticks >= 8) window.clearInterval(id);
		}, 1400);
		return () => window.clearInterval(id);
	}, [router]);

	return (
		<p className="mt-4" aria-live="polite">
			Objednávka je v zásobníku. Pečiatka padne o chvíľu — ten istý výtlačok si dvaja naraz nevezmú.
		</p>
	);
}
