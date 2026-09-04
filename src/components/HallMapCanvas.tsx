'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { LIBRARY_PLACE } from '@/config/place';
import { cn } from '@/utils/cn';
import 'leaflet/dist/leaflet.css';

const START_ZOOM = 16;
const MIN_ZOOM = 13;
const MAX_ZOOM = 19;

type MapHandle = {
	zoomIn: () => void;
	zoomOut: () => void;
	setView: (center: [number, number], zoom: number) => void;
};

export function HallMapCanvas() {
	const host = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapHandle | null>(null);
	const [zoom, setZoom] = useState(START_ZOOM);

	useEffect(() => {
		if (!host.current) return;

		const world: {
			map?: import('leaflet').Map;
			onResize?: () => void;
			onZoom?: () => void;
		} = {};
		let cancelled = false;

		void import('leaflet').then((leaflet) => {
			if (cancelled || !host.current) return;
			const L = leaflet.default;

			const map = L.map(host.current, {
				center: [LIBRARY_PLACE.lat, LIBRARY_PLACE.lon],
				zoom: START_ZOOM,
				minZoom: MIN_ZOOM,
				maxZoom: MAX_ZOOM,
				zoomControl: false,
				scrollWheelZoom: true,
				attributionControl: true
			});

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: MAX_ZOOM,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(map);

			const pin = L.divIcon({
				className: 'hall-map-marker',
				iconSize: [72, 76],
				iconAnchor: [36, 70],
				html: '<p class="hall-map-pin"><span>B</span>knižnica</p>'
			});

			L.marker([LIBRARY_PLACE.lat, LIBRARY_PLACE.lon], {
				icon: pin,
				keyboard: false,
				title: `${LIBRARY_PLACE.name}, ${LIBRARY_PLACE.street}`
			}).addTo(map);

			const onZoom = () => setZoom(Math.round(map.getZoom()));
			const onResize = () => map.invalidateSize();
			map.on('zoomend', onZoom);
			window.addEventListener('resize', onResize);
			requestAnimationFrame(() => map.invalidateSize());

			world.map = map;
			world.onZoom = onZoom;
			world.onResize = onResize;
			mapRef.current = map;
		});

		return () => {
			cancelled = true;
			if (world.onResize) window.removeEventListener('resize', world.onResize);
			if (world.map && world.onZoom) world.map.off('zoomend', world.onZoom);
			world.map?.remove();
			mapRef.current = null;
		};
	}, []);

	function zoomBy(delta: number) {
		if (delta > 0) mapRef.current?.zoomIn();
		else mapRef.current?.zoomOut();
	}

	function reset() {
		mapRef.current?.setView([LIBRARY_PLACE.lat, LIBRARY_PLACE.lon], START_ZOOM);
	}

	return (
		<div className="hall-map-stage">
			<div ref={host} className="hall-map-leaflet" />
			<div className="hall-map-grain" aria-hidden="true" />
			<div className="hall-map-zoom" role="group" aria-label="Ovládanie mapy">
				<button
					type="button"
					className={cn('hall-map-zoom-btn', zoom >= MAX_ZOOM && 'is-off')}
					aria-label="Priblížiť"
					disabled={zoom >= MAX_ZOOM}
					onClick={() => zoomBy(1)}
				>
					<Plus className="size-3.5" strokeWidth={2.2} />
				</button>
				<p className="hall-map-zoom-level" aria-live="polite">
					{zoom}
				</p>
				<button
					type="button"
					className={cn('hall-map-zoom-btn', zoom <= MIN_ZOOM && 'is-off')}
					aria-label="Oddialiť"
					disabled={zoom <= MIN_ZOOM}
					onClick={() => zoomBy(-1)}
				>
					<Minus className="size-3.5" strokeWidth={2.2} />
				</button>
				<button
					type="button"
					className="hall-map-zoom-btn is-locate"
					aria-label="Vrátiť na školu"
					onClick={reset}
				>
					<LocateFixed className="size-3.5" strokeWidth={2.2} />
				</button>
			</div>
		</div>
	);
}
