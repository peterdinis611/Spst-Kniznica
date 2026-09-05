import './wait-stamp.css';

export function HallSplash({ copy = 'Otváram fond.' }: { copy?: string }) {
	return (
		<div className="wait" role="status" aria-live="polite" aria-busy="true">
			<p className="sr-only">{copy}</p>
			<div className="wait-blotter" aria-hidden="true">
				<div className="wait-orbit">
					{[0, 1, 2, 3, 4, 5, 6, 7].map((hole) => (
						<span key={hole} style={{ ['--i' as string]: hole }} />
					))}
				</div>
				<p className="wait-stamp">SPŠT</p>
			</div>
			<p className="wait-copy" aria-hidden="true">
				{copy}
			</p>
		</div>
	);
}
