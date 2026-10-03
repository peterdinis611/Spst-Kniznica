import { FolioLink as Link } from '@/components/FolioLink';
import type { DeskQueue, DeskQueueRow } from '@/server/desk/queue';
import { pullClassLoan, renewClassLoan } from '@/app/(desk)/admin/actions';

function Rail({
	title,
	rows,
	empty,
	klass,
	teacher
}: {
	title: string;
	rows: DeskQueueRow[];
	empty: string;
	klass?: string;
	teacher?: boolean;
}) {
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
							{teacher && klass && (row.canRenew || row.canPull) ? (
								<div className="pult-rail-acts">
									{row.canRenew ? (
										<form action={renewClassLoan}>
											<input type="hidden" name="loanId" value={row.id} />
											<input type="hidden" name="class" value={klass} />
											<button type="submit">Predĺžiť</button>
										</form>
									) : null}
									{row.canPull ? (
										<form action={pullClassLoan}>
											<input type="hidden" name="loanId" value={row.id} />
											<input type="hidden" name="class" value={klass} />
											<button type="submit">Stiahnuť</button>
										</form>
									) : null}
								</div>
							) : null}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export function DeskQueueBoard({
	queue,
	teacher = false,
	klass = ''
}: {
	queue: DeskQueue;
	teacher?: boolean;
	klass?: string;
}) {
	return (
		<div className="pult-queue">
			<p className="pult-queue-kicker">{teacher ? 'trieda vonku' : 'dnešný rad'}</p>
			<Rail
				title="Po lehote"
				rows={queue.overdue}
				empty="Nikto nie je po lehote."
				klass={klass}
				teacher={teacher}
			/>
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
