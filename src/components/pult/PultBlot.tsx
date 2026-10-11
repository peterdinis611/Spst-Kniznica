export function PultBlot({ stamp, fault }: { stamp?: string; fault?: string }) {
	if (fault) {
		return (
			<p className="pult-note" role="alert">
				{fault}
			</p>
		);
	}
	if (!stamp) return null;
	const labels: Record<string, string> = {
		ok: 'Uložené',
		gone: 'Zmazané',
		borrow: 'Vypožičané',
		return: 'Vrátené',
		found: 'Nájdené',
		lost: 'Stratené',
		walk: 'Chôdza otvorená',
		closed: 'Inventúra uzavretá',
		year: 'Ročníky posunuté'
	};
	return <p className="pult-note">{labels[stamp] ?? stamp}</p>;
}
