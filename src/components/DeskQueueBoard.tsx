import { FolioLink as Link } from '@/components/FolioLink';
import type { DeskQueue, DeskQueueRow } from '@/server/desk/queue';

function Rail({ title, rows, empty }: { title: string; rows: DeskQueueRow[]; empty: string }) {
	return (
		<div className="pult-rail">
			<p className="pult-rail-head">{title}</p>
			{rows.length === 0 ? (
				<p className="pult-queue-empty">{empty}</p>
			) : (
				<ul>
					{rows.map((row) => (
						<li key={row.id}>
							<Link href={row.href}>
								<em>{row.stamp}</em>
								<strong>{row.title}</strong>
								<span>{row.detail}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export function DeskQueueBoard({
	queue,
	teacher = false
}: {
	queue: DeskQueue;
	teacher?: boolean;
}) {
	return (
		<div className="pult-queue">
			<p className="pult-queue-kicker">{teacher ? 'trieda vonku' : 'dnešný rad'}</p>
			<Rail title="Po lehote" rows={queue.overdue} empty="Nikto nie je po lehote." />
			<Rail title="Cestou na pult" rows={queue.inbound} empty="Nikto nenahlásil vrátenie." />
			{teacher ? null : (
				<>
					<Rail title="Na pulte" rows={queue.pickup} empty="Žiadny čakací lístok na pulte." />
					<Rail title="Čakajú" rows={queue.waiting} empty="Rad je prázdny." />
				</>
			)}
		</div>
	);
}
