import { FolioLink as Link } from '@/components/FolioLink';
import { pageMeta } from '@/utils/metadata';
import { stampDate } from '@/utils/format';
import { canOperateDesk } from '@/server/admin-access';
import { hopperCounts, listBossSlips } from '@/server/hopper';
import { startBoss } from '@/server/boss';
import { folioBackupBytesLabel, folioBackupStamp, listFolioBackups } from '@/server/folio-backup';
import { deskQueue } from '@/server/desk/queue';
import { getSessionReader } from '@/server/session';
import { redirect } from 'next/navigation';
import { cancelQueueJob, retryQueueJob, runQueueBackup, runQueueTick } from './actions';

export const metadata = pageMeta({
	title: 'Fronta',
	description: 'Zásobník lístkov, objednávok a nočnej zálohy pultu.',
	index: false
});

export default async function AdminQueuePage({
	searchParams
}: {
	searchParams: Promise<{
		tik?: string;
		soon?: string;
		late?: string;
		holds?: string;
		zaloha?: string;
		file?: string;
		bytes?: string;
	}>;
}) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOperateDesk(user)) {
		return <p className="pult-empty">Zásobník lístkov je len pre knihovníka.</p>;
	}

	await startBoss().catch(() => null);
	const params = await searchParams;
	const [counts, slips, queue, backups] = await Promise.all([
		hopperCounts(),
		listBossSlips(),
		deskQueue(),
		listFolioBackups()
	]);
	const orders = [...queue.pickup, ...queue.waiting];
	const stamped = params.tik === '1';
	const backupState = params.zaloha;

	return (
		<div className="pult-hopper-page">
			<p className="pult-queue-kicker">11 fronta</p>
			<h2 className="pult-hopper-title">Zásobník lístkov</h2>
			<p className="pult-lede">
				Objednávky, listy a nočná záloha idú do radu. Pult sa pri súbehu neupchá — lístok čaká, kým
				ho zásobník vytiahne.
			</p>

			{stamped || backupState ? (
				<div className="pult-hopper-blots">
					{stamped ? (
						<p className="pult-blot is-clear">
							<em>tik spustený</em>
							<strong>{Number(params.late ?? 0)}</strong>
							<span>
								po lehote · {params.soon ?? 0} zajtra · {params.holds ?? 0} holdov
							</span>
						</p>
					) : null}
					{backupState === '1' ? (
						<p className="pult-blot is-clear">
							<em>záloha v zásobníku</em>
							<strong>folio</strong>
							<span>pg-boss ju vytiahne. Súbor padne do police.</span>
						</p>
					) : null}
					{backupState === '2' ? (
						<p className="pult-blot is-clear">
							<em>záloha hotová</em>
							<strong>{folioBackupBytesLabel(Number(params.bytes ?? 0))}</strong>
							<span>{params.file ?? 'odpis fondu'}</span>
						</p>
					) : null}
					{backupState === '0' ? (
						<p className="pult-blot">
							<em>záloha zlyhala</em>
							<strong>—</strong>
							<span>pg_dump ani Docker som nenašiel.</span>
						</p>
					) : null}
				</div>
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
					<form action={runQueueBackup}>
						<button type="submit" className="is-slip">
							Záloha teraz
						</button>
					</form>
					<p>
						{counts.ready
							? 'Listy idú cez folio-mail, tik každých 30 minút, záloha každú noc o 3:00.'
							: 'Zásobník ešte nie je v Postgres. Poštu zatiaľ pult posiela hneď.'}
					</p>
				</div>
			</div>

			<section className="pult-backup-shelf">
				<p className="pult-queue-kicker">zálohy fondu</p>
				{backups.length === 0 ? (
					<p className="pult-queue-empty">
						Ešte žiadny odpis. Padne sem po noci, alebo ho peciatkuješ teraz.
					</p>
				) : (
					<ol className="pult-backup-stack">
						{backups.map((slip) => (
							<li key={slip.name}>
								<a href={`/api/desk/backup?file=${encodeURIComponent(slip.name)}`}>
									<em>{folioBackupStamp(slip.name)}</em>
									<strong>{slip.name}</strong>
									<span>{folioBackupBytesLabel(slip.bytes)}</span>
								</a>
							</li>
						))}
					</ol>
				)}
			</section>

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
						<Link className="pult-rail-head" href="/admin/reservations">
							objednávky · {orders.length}
						</Link>
						<ul>
							{orders.map((row) => (
								<li key={row.id}>
									<Link href={row.href}>
										<em>{row.stamp}</em>
										<strong>{row.title}</strong>
										<span>{row.detail}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				)}
			</section>
		</div>
	);
}
