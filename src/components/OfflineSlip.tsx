'use client';

import { useEffect, useState } from 'react';
import './offline-slip.css';

export function OfflineSlip() {
	const [online, setOnline] = useState(true);
	const [restored, setRestored] = useState(false);

	useEffect(() => {
		setOnline(navigator.onLine);
		let restoreTimer: ReturnType<typeof setTimeout> | undefined;

		function clearRestore() {
			if (restoreTimer) clearTimeout(restoreTimer);
			restoreTimer = undefined;
		}

		function goOffline() {
			clearRestore();
			setOnline(false);
			setRestored(false);
		}

		function goOnline() {
			setOnline(true);
			setRestored(true);
			clearRestore();
			restoreTimer = setTimeout(() => setRestored(false), 3200);
		}

		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);
		return () => {
			clearRestore();
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
		};
	}, []);

	if (!online) {
		return (
			<div className="slip is-off" role="alert" aria-live="assertive">
				<p className="slip-kicker">Katalógová poznámka</p>
				<p className="slip-title">Spojenie s pultom padlo.</p>
				<p className="slip-lead">Fond ostáva na obrazovke. Výpožička a hľadanie počkajú, kým sieť naskočí.</p>
				<span className="slip-stamp">Mimo sieť</span>
			</div>
		);
	}

	if (!restored) return null;

	return (
		<div className="slip is-on" role="status" aria-live="polite">
			<p className="slip-kicker">Pult znova berie</p>
			<p className="slip-title">Spojenie je späť.</p>
			<p className="slip-lead">Karty a výpožičky znova prechádzajú sieťou.</p>
		</div>
	);
}
