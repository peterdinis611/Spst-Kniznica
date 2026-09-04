import type { ReactNode } from 'react';
import './auth-pass.css';

export function AuthPass({
	kicker,
	title,
	lede,
	serial = 'PREUKAZ · PAV. B',
	facts = ['7–21 dní', 'bez stropu', 'pavilón B'],
	tabs,
	children
}: {
	kicker: string;
	title: string;
	lede: string;
	serial?: string;
	facts?: string[];
	tabs?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="pass">
			<div className="pass-copy">
				<p className="pass-kicker">{kicker}</p>
				<h2 className="pass-title">{title}</h2>
				<p className="pass-lede">{lede}</p>
				{facts.length ? (
					<ul className="pass-facts">
						{facts.map((fact) => (
							<li key={fact}>{fact}</li>
						))}
					</ul>
				) : null}
			</div>
			<article className="pass-card">
				<span className="pass-spine" aria-hidden="true" />
				<div className="pass-holes" aria-hidden="true">
					<span />
					<span />
					<span />
					<span />
				</div>
				<div className="pass-head">
					<p className="pass-mark">čitateľský preukaz</p>
					<p className="pass-stamp" aria-hidden="true">
						SPŠT
					</p>
				</div>
				{tabs ? (
					<nav className="pass-tabs" aria-label="Účet">
						{tabs}
					</nav>
				) : null}
				<div className="pass-body">{children}</div>
				<p className="pass-serial">{serial}</p>
			</article>
		</section>
	);
}
