'use client';

export function FaultReload() {
	return (
		<button type="button" className="fault-cta" onClick={() => location.reload()}>
			Skúsiť znova
		</button>
	);
}
