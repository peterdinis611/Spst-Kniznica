import { LIBRARY_OSM_EMBED, LIBRARY_OSM_LINK, LIBRARY_PLACE } from '@/config/place';

function CampusPlan() {
	return (
		<svg
			className="hall-plan-svg"
			viewBox="0 0 360 280"
			role="img"
			aria-labelledby="campus-title campus-desc"
		>
			<title id="campus-title">Plán areálu SPŠT</title>
			<desc id="campus-desc">
				Pavilón B s knižnicou je v strede areálu, pavilón A vľavo a pavilón C vpravo. Vstup je z
				Hviezdoslavovej.
			</desc>
			<rect className="hall-plan-sheet" x="8" y="8" width="344" height="264" rx="10" />
			<path className="hall-plan-street" d="M18 228h324" />
			<text className="hall-plan-street-label" x="180" y="250" textAnchor="middle">
				Hviezdoslavova
			</text>
			<path className="hall-plan-path" d="M180 228v-28" />
			<g className="hall-plan-block is-side" transform="translate(36 86)">
				<rect x="0" y="0" width="78" height="96" rx="4" />
				<text x="39" y="48" textAnchor="middle">
					A
				</text>
				<text className="hall-plan-hint" x="39" y="68" textAnchor="middle">
					dielne
				</text>
			</g>
			<g className="hall-plan-block is-lib" transform="translate(132 58)">
				<rect x="0" y="0" width="96" height="124" rx="5" />
				<text x="48" y="52" textAnchor="middle">
					B
				</text>
				<text className="hall-plan-hint" x="48" y="74" textAnchor="middle">
					knižnica
				</text>
				<text className="hall-plan-hint" x="48" y="92" textAnchor="middle">
					1. posch.
				</text>
			</g>
			<g className="hall-plan-block is-side" transform="translate(248 86)">
				<rect x="0" y="0" width="78" height="96" rx="4" />
				<text x="39" y="48" textAnchor="middle">
					C
				</text>
				<text className="hall-plan-hint" x="39" y="68" textAnchor="middle">
					siete
				</text>
			</g>
			<g className="hall-plan-north" transform="translate(300 28)">
				<polygon points="12,0 18,22 12,18 6,22" />
				<text x="12" y="36" textAnchor="middle">
					S
				</text>
			</g>
			<text className="hall-plan-mark" x="24" y="32">
				SPŠT · areál
			</text>
		</svg>
	);
}

export function HallMap() {
	const address = `${LIBRARY_PLACE.street}, ${LIBRARY_PLACE.zip} ${LIBRARY_PLACE.city}`;

	return (
		<div className="hall-map">
			<figure className="hall-plan">
				<CampusPlan />
				<figcaption>
					<strong>Pavilón B</strong>
					<span>knižnica · {LIBRARY_PLACE.floor}</span>
				</figcaption>
			</figure>
			<div className="hall-map-card">
				<div className="hall-map-frame">
					<iframe
						title={`Mapa ${LIBRARY_PLACE.name}, ${address}`}
						src={LIBRARY_OSM_EMBED}
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
					<div className="hall-map-grain" aria-hidden="true" />
					<p className="hall-map-pin">
						<span>B</span>
						knižnica
					</p>
				</div>
				<div className="hall-map-legend">
					<p className="hall-map-kicker">
						{LIBRARY_PLACE.pavilion} · {LIBRARY_PLACE.floor}
					</p>
					<p className="hall-map-address">{address}</p>
					<p className="hall-map-hours">{LIBRARY_PLACE.hours}</p>
					<a
						className="hall-map-go no-underline"
						href={LIBRARY_OSM_LINK}
						rel="noreferrer"
						target="_blank"
					>
						Otvoriť mapu
					</a>
				</div>
			</div>
		</div>
	);
}
