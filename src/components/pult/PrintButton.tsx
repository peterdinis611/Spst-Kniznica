'use client';

export function PrintButton({ label = 'Tlačiť' }: { label?: string }) {
	return (
		<button type="button" className="pult-ghost" onClick={() => window.print()}>
			{label}
		</button>
	);
}
