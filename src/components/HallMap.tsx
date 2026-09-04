import { ExternalLink } from 'lucide-react';
import { LIBRARY_OSM_LINK, LIBRARY_PLACE } from '@/config/place';
import { HallMapCanvas } from './HallMapCanvas';

function CampusPlan() {
	return (
		<svg
			className="hall-plan-svg"
			viewBox="0 0 360 248"
			role="img"
			aria-labelledby="campus-title campus-desc"
		>
			<title id="campus-title">Plán areálu SPŠT</title>
			<desc id="campus-desc">
				Pavilón B s knižnicou je v strede areálu, pavilón A vľavo a pavilón C vpravo. Vstup je z
				Komenského.
			</desc>
			<path className="hall-plan-street" d="M18 196h324" />
			<text className="hall-plan-street-label" x="180" y="226" textAnchor="middle">
				Komenského
			</text>
			<path className="hall-plan-path" d="M180 196v-24" />
			<g className="hall-plan-block is-side" transform="translate(36 58)">
				<rect x="0" y="0" width="78" height="96" rx="4" />
				<text x="39" y="48" textAnchor="middle">
					A
				</text>
				<text className="hall-plan-hint" x="39" y="68" textAnchor="middle">
					dielne
				</text>
			</g>
			<g className="hall-plan-block is-lib" transform="translate(132 30)">
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
			<g className="hall-plan-block is-side" transform="translate(248 58)">
				<rect x="0" y="0" width="78" height="96" rx="4" />
				<text x="39" y="48" textAnchor="middle">
					C
				</text>
				<text className="hall-plan-hint" x="39" y="68" textAnchor="middle">
					siete
				</text>
			</g>
			<g className="hall-plan-north" transform="translate(308 8)">
				<polygon points="12,0 18,22 12,18 6,22" />
				<text x="12" y="36" textAnchor="middle">
					S
				</text>
			</g>
			<text className="hall-plan-mark" x="8" y="22">
				SPŠT · areál
			</text>
		</svg>
	);
}

export function HallMap() {
	const address = `${LIBRARY_PLACE.street}, ${LIBRARY_PLACE.zip} ${LIBRARY_PLACE.city}`;

	return (
		<div className="hall-map">
			<div className="hall-map-card">
				<div className="hall-map-frame">
					<HallMapCanvas />
				</div>
				<div className="hall-map-legend">
					<div className="hall-map-copy">
						<p className="hall-map-address">{address}</p>
						<p className="hall-map-hours">{LIBRARY_PLACE.hours}</p>
					</div>
					<a
						className="hall-map-go no-underline"
						href={LIBRARY_OSM_LINK}
						rel="noreferrer"
						target="_blank"
					>
						Otvoriť mapu
						<ExternalLink className="size-3.5" strokeWidth={2.2} />
					</a>
				</div>
			</div>
			<figure className="hall-plan">
				<CampusPlan />
				<figcaption>
					<strong>{LIBRARY_PLACE.pavilion}</strong>
					<span>knižnica · {LIBRARY_PLACE.floor}</span>
				</figcaption>
			</figure>
		</div>
	);
}
