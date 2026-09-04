import { FaultReload } from './FaultReload';
import './fault-folio.css';

export function FaultFolio({ status, message }: { status: number; message?: string }) {
	const jammed = status >= 500;
	const digits = String(status).split('');
	const stamp = jammed ? 'PORUCHA' : 'CHÝBA';
	const kicker = jammed ? 'Porucha pultu' : 'Katalógová poznámka';
	const title = jammed ? 'Zásuvka sa zasekla.' : 'Karta nie je v zásuvke.';
	const leaked = Boolean(
		message &&
			/ENOENT|EACCES|EPERM|\.next|node_modules|\/Users\/|\/home\/|Not Found|Internal Error/.test(message)
	);
	const lead =
		jammed || leaked || !message
			? jammed
				? 'Fond túto kartu teraz neotvorí. Skús znova, alebo sa vráť na sieň.'
				: 'Signatúra v registri nie je — alebo ju niekto vrátil do nesprávneho šuplíka.'
			: message;

	return (
		<main id="obsah" className="fault" data-kind={jammed ? 'jammed' : 'missing'} aria-labelledby="fault-title">
			<div className="fault-grain" aria-hidden="true" />
			<div className="fault-wash" aria-hidden="true" />
			<p className="fault-kicker">
				{kicker} · {status}
			</p>
			<div className="fault-grid">
				<div className="fault-stage" aria-hidden="true">
					<svg className="fault-drawer" viewBox="0 0 360 260" fill="none">
						<rect className="cabinet" x="18" y="28" width="324" height="204" rx="10" />
						<rect className="cabinet-lip" x="18" y="28" width="324" height="22" rx="10" />
						<path className="cabinet-rule" d="M34 62h292" />
						<rect className="well" x="38" y="78" width="284" height="132" rx="6" />
						<g className="drawer-face">
							<rect x="46" y="86" width="268" height="116" rx="5" />
							<rect className="plate" x="138" y="128" width="84" height="28" rx="3" />
							<circle className="knob" cx="180" cy="142" r="7" />
						</g>
						{jammed ? (
							<>
								<path className="crack" d="M78 92l22 38-14 24 28 36" />
								<ellipse className="blot" cx="268" cy="168" rx="34" ry="22" />
							</>
						) : null}
					</svg>
					<div className={`fault-card${jammed ? ' is-torn' : ''}`}>
						<span>SPŠT · lístok</span>
						<strong>{jammed ? 'Zaseknutý výpis' : 'Prázdna signatúra'}</strong>
						<em>{jammed ? 'pult neodpovedá' : 'zásuvka prázdna'}</em>
					</div>
					<div className="fault-digits">
						{digits.map((digit, i) => (
							<span key={i} style={{ ['--i' as string]: i }}>
								{digit}
							</span>
						))}
					</div>
					<div className="fault-stamp">{stamp}</div>
				</div>
				<div className="fault-copy">
					<h1 id="fault-title">{title}</h1>
					<p>{lead}</p>
					<nav aria-label="Čo ďalej">
						{jammed ? (
							<FaultReload />
						) : (
							<a className="fault-cta no-underline" href="/discover">
								Do fondu
							</a>
						)}
						<a className="fault-ghost no-underline" href="/">
							Na sieň
						</a>
					</nav>
				</div>
			</div>
		</main>
	);
}
