import { pageMeta } from '@/utils/metadata';
import { stampDate } from '@/utils/format';
import { canOperateDesk } from '@/server/admin-access';
import { hopperCounts, listBossSlips } from '@/server/hopper';
import { startBoss } from '@/server/boss';
import { deskQueue } from '@/server/desk/queue';
import { getSessionReader } from '@/server/session';
import { redirect } from 'next/navigation';
import { cancelQueueJob, retryQueueJob, runQueueTick } from './actions';

export const metadata = pageMeta({
	title: 'Fronta',
	description: 'Zásobník lístkov a objednávok pultu.',
	index: false
});

export default async function AdminQueuePage({
	searchParams
}: {
	searchParams: Promise<{ tik?: string; soon?: string; late?: string; holds?: string }>;
}) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOperateDesk(user)) {
		return <p className="pult-empty">Zásobník lístkov je len pre knihovníka.</p>;
	}

	await startBoss().catch(() => null);
	const params = await searchParams;
	const [counts, slips, queue] = await Promise.all([hopperCounts(), listBossSlips(), deskQueue()]);
	const orders = [...queue.pickup, ...queue.waiting];
	const stamped = params.tik === '1';

	return (
		<div className="pult-hopper-page">
			<p className="pult-queue-kicker">11 fronta</p>
			<h2 className="pult-hopper-title">Zásobník lístkov</h2>
			<p className="pult-lede">
				Objednávky a listy idú do radu. Pult sa pri súbehu neupchá — lístok čaká, kým ho zásobník
				vytiahne.
			</p>

			{stamped ? (
				<p className="pult-blot is-clear">
					<em>tik spustený</em>
					<strong>{Number(params.late ?? 0)}</strong>
					<span>
						po lehote · {params.soon ?? 0} zajtra · {params.holds ?? 0} holdov
					</span>
				</p>
			) : null}

			<div className="pult-hopper">
				<div className="pult-hopper-mouth" aria-hidden="true" />
				<div className="pult-stats">
					<div className="pult-stat">
						<em>11</em>
						<b>{counts.queued}</b>
						<span>čaká</span>
					</div>
					<div className="pult-stat">
						<em>beží</em>
						<b>{counts.active}</b>
						<span>v peciatke</span>
					</div>
					<div className="pult-stat">
						<em>chyba</em>
						<b>{counts.failed}</b>
						<span>zlyhalo</span>
					</div>
					<div className="pult-stat">
						<em>hotovo</em>
						<b>{counts.completed}</b>
						<span>odpečiatkované</span>
					</div>
				</div>
				<div className="pult-hopper-acts">
					<form action={runQueueTick}>
						<button type="submit">Tik teraz</button>
					</form>
					<p>
						{counts.ready
							? 'Zásobník je otvorený. Listy idú cez folio-mail, tik každých 30 minút.'
							: 'Zásobník ešte nie je v Postgres. Poštu zatiaľ pult posiela hneď.'}
					</p>
				</div>
			</div>

			<section className="pult-hopper-well">
				<p className="pult-queue-kicker">lístky v rade</p>
				{slips.length === 0 ? (
					<p className="pult-queue-empty">
						Zásobník je prázdny. Ďalší lístok padne pri objednávke.
					</p>
				) : (
					<table className="pult-table">
						<thead>
							<tr>
								<th>Stav</th>
								<th>Lístok</th>
								<th>Pečiatka</th>
								<th>Kedy</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{slips.map((slip) => (
								<tr key={slip.id}>
									<td>
										<strong>{slip.stateLabel}</strong>
										<em>
											{slip.name}
											{slip.retryCount ? ` · ${slip.retryCount}×` : ''}
										</em>
									</td>
									<td>
										<strong>{slip.title}</strong>
										<em>{slip.detail}</em>
									</td>
									<td>
										<span className={`pult-role${slip.state === 'failed' ? '' : ' is-desk'}`}>
											{slip.stamp}
										</span>
									</td>
									<td>
										<em>{stampDate(slip.createdOn)}</em>
									</td>
									<td>
										<div className="pult-actions">
											{slip.canRetry ? (
												<form action={retryQueueJob}>
													<input type="hidden" name="id" value={slip.id} />
													<input type="hidden" name="name" value={slip.name} />
													<button type="submit" className="pult-ghost">
														Znova
													</button>
												</form>
											) : null}
											{slip.canCancel ? (
												<form action={cancelQueueJob}>
													<input type="hidden" name="id" value={slip.id} />
													<input type="hidden" name="name" value={slip.name} />
													<button type="submit" className="pult-ghost">
														Stiahnuť
													</button>
												</form>
											) : null}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			<section className="pult-queue">
				<p className="pult-queue-kicker">dnes v rade</p>
				{orders.length === 0 ? (
					<p className="pult-queue-empty">Žiadna objednávka na pulte ani v čakacom rade.</p>
				) : (
					<div className="pult-rail">
						<a className="pult-rail-head" href="/admin/reservations">
							objednávky · {orders.length}
						</a>
						<ul>
							{orders.map((row) => (
								<li key={row.id}>
									<a href={row.href}>
										<em>{row.stamp}</em>
										<strong>{row.title}</strong>
										<span>{row.detail}</span>
									</a>
								</li>
							))}
						</ul>
					</div>
				)}
			</section>
		</div>
	);
}
