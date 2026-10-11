import { holdingLabel } from '@/desk/admin';
import { PrintButton } from '@/components/pult/PrintButton';
import { listInventoryRows, listOverdueRows } from '@/server/desk/reports';
import { daysLabel, stampDate } from '@/utils/format';
import { pageMeta } from '@/utils/metadata';

export const metadata = pageMeta({
	title: 'Výkazy',
	description: 'Inventúra fondu a oneskorené lístky — na tlač a CSV.',
	index: false
});

export default async function AdminReportsPage() {
	const [inventory, overdue] = await Promise.all([listInventoryRows(), listOverdueRows()]);
	const out = inventory.filter((row) => row.status === 'loaned').length;
	const stamp = stampDate(new Date());

	return (
		<div className="pult-folio">
			<header className="pult-folio-mast">
				<p className="pult-folio-kicker">pavilón B · stav k {stamp}</p>
				<h2>Stav fondu.</h2>
				<p className="pult-folio-lede">
					Dva listy pre polrok: inventúra výtlačkov a lístky po lehote. Tlač ide do PDF. CSV otvoríš
					v tabuľke.
				</p>
				<em className="pult-folio-seal" aria-hidden="true">
					SPŠT
				</em>
				<div className="pult-folio-acts">
					<PrintButton label="Tlačiť list" />
					<a href="/admin/reports/inventory.csv">CSV inventúra</a>
					<a href="/admin/reports/overdue.csv">CSV po lehote</a>
				</div>
			</header>

			<section className="pult-folio-sheet" aria-labelledby="folio-inv">
				<p className="pult-folio-index">01</p>
				<div>
					<h3 id="folio-inv">Inventúra</h3>
					<p>
						{inventory.length.toLocaleString('sk-SK')} výtlačkov · {out.toLocaleString('sk-SK')}{' '}
						vonku
					</p>
				</div>
				{inventory.length === 0 ? (
					<p className="pult-folio-empty">Fond je prázdny.</p>
				) : (
					<table className="pult-table">
						<thead>
							<tr>
								<th>Inventár</th>
								<th>Stav</th>
								<th>Signatúra</th>
								<th>Zväzok</th>
								<th>Odbor</th>
							</tr>
						</thead>
						<tbody>
							{inventory.map((row) => (
								<tr key={row.inventoryNo}>
									<td>
										<strong>{row.inventoryNo}</strong>
									</td>
									<td>{holdingLabel(row.status)}</td>
									<td>
										<em>{row.callNumber}</em>
									</td>
									<td>
										<strong>{row.title}</strong>
										<em>
											{row.isbn} · {row.year}
										</em>
									</td>
									<td>{row.categoryCode}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			<section className="pult-folio-sheet" aria-labelledby="folio-late">
				<p className="pult-folio-index">02</p>
				<div>
					<h3 id="folio-late">Po lehote</h3>
					<p>
						{overdue.length === 0
							? 'Žiadny otvorený lístok po termíne.'
							: `${overdue.length.toLocaleString('sk-SK')} lístkov`}
					</p>
				</div>
				{overdue.length === 0 ? null : (
					<table className="pult-table">
						<thead>
							<tr>
								<th>Trieda</th>
								<th>Čitateľ</th>
								<th>Zväzok</th>
								<th>Lehota</th>
								<th>Meškanie</th>
							</tr>
						</thead>
						<tbody>
							{overdue.map((row) => (
								<tr key={row.id}>
									<td>{row.klass || '—'}</td>
									<td>
										<strong>
											{row.firstName} {row.lastName}
										</strong>
									</td>
									<td>
										<strong>{row.title}</strong>
										<em>{row.callNumber}</em>
									</td>
									<td>{stampDate(row.dueAt)}</td>
									<td>{daysLabel(row.lateDays)}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>
		</div>
	);
}
