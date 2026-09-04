const links = [
	{ href: '/discover', label: 'Objavovať' },
	{ href: '/holdings', label: 'Všetky knihy' },
	{ href: '/books', label: 'Katalóg' },
	{ href: '/departments', label: 'Odbory' },
	{ href: '/authors', label: 'Autori' },
	{ href: '/docs', label: 'Príručka' }
] as const;

export function Footer({ tone = 'desk' }: { tone?: 'desk' | 'hall' }) {
	const year = new Date().getFullYear();
	if (tone === 'hall') {
		return (
			<footer className="hall-foot">
				<p className="hall-kicker">Pavilón B · 1. poschodie</p>
				<p className="hall-foot-brand">SPŠT knižnica</p>
				<p className="hall-foot-lead">
					Školský fond učebníc, noriem a literatúry. 7–21 dní, bez stropu na počet kníh. Po—Pia 7:30—15:30.
				</p>
				<nav aria-label="Pätička">
					{links.map((link) => (
						<a key={link.href} href={link.href}>
							{link.label}
						</a>
					))}
				</nav>
				<p className="hall-foot-copy">© {year} SPŠT knižnica · interný školský fond</p>
			</footer>
		);
	}

	return (
		<footer className="mt-11 grid justify-items-center gap-2.5 border-t border-border pt-6 pb-1.5 text-center text-[0.82rem] text-muted-foreground">
			<p>SPŠT knižnica · pavilón B · Po—Pia 7:30—15:30</p>
			<nav className="flex flex-wrap justify-center gap-x-[1.15rem] gap-y-[0.45rem]" aria-label="Pätička">
				{links.map((link) => (
					<a key={link.href} href={link.href} className="text-inherit no-underline hover:text-foreground">
						{link.label}
					</a>
				))}
			</nav>
		</footer>
	);
}
