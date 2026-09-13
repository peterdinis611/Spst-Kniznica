import { redirect } from 'next/navigation';
import { DeskQueueBoard } from '@/components/DeskQueueBoard';
import { FolioLink as Link } from '@/components/FolioLink';
import { normalizeClass } from '@/desk/borrow-fields';
import { canOperateDesk } from '@/server/admin-access';
import { deskCounts } from '@/server/desk/counts';
import { countOpenClassLoans, listDeskClasses } from '@/server/desk/loans';
import { deskQueue, emptyDeskQueue } from '@/server/desk/queue';
import { hopperCounts } from '@/server/hopper';
import { getSessionReader } from '@/server/session';
import { pageMeta } from '@/utils/metadata';

export const metadata = pageMeta({
	title: 'Pult',
	description: 'Správa školského fondu SPŠT — kartotéka tabuliek.',
	index: false
});

export default async function AdminHome({
	searchParams
}: {
	searchParams: Promise<{ class?: string }>;
}) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const manage = canOperateDesk(user);
	const params = await searchParams;

	if (!manage) {
		const classes = await listDeskClasses();
		const klass = normalizeClass(params.class ?? user.className ?? classes[0] ?? '');
		const [queue, open] = await Promise.all([
			klass ? deskQueue(new Date(), klass) : Promise.resolve(emptyDeskQueue()),
			klass ? countOpenClassLoans(klass) : Promise.resolve(0)
		]);
		return (
			<div className="pult-today">
				<div>
					<p className="pult-lede">
						{klass ? `${klass} · ${open} kníh vonku` : 'Vyber triedu, uvidíš lístky vonku.'}
					</p>
					<p className="pult-queue-kicker mt-3">Fond nemeníš — len čítaš triedu.</p>
					<nav className="pult-class-rail" aria-label="Triedy">
						{classes.map((item) => (
							<Link
								key={item}
								href={`/admin?class=${encodeURIComponent(item)}`}
								className={item === klass ? 'is-on' : undefined}
							>
								{item}
							</Link>
						))}
					</nav>
					{classes.length === 0 ? (
						<form className="mt-4 flex gap-2" method="GET">
							<input
								name="class"
								defaultValue={klass}
								placeholder="II.A"
								className="rounded-full border px-3 py-2"
							/>
							<button
								type="submit"
								className="rounded-full bg-primary px-4 text-primary-foreground"
							>
								Otvoriť
							</button>
						</form>
					) : null}
				</div>
				<DeskQueueBoard queue={queue} teacher />
			</div>
		);
	}

	const [counts, queue, hopper] = await Promise.all([deskCounts(), deskQueue(), hopperCounts()]);
	const cards = [
		{ href: '/admin/books', n: counts.books, label: 'kníh', code: '04' },
		{ href: '/admin/departments', n: counts.categories, label: 'odborov', code: '02' },
		{ href: '/admin/authors', n: counts.authors, label: 'autorov', code: '03' },
		{ href: '/admin/book-authors', n: counts.links, label: 'väzieb', code: '05' },
		{ href: '/admin/holdings', n: counts.holdings, label: 'výtlačkov', code: '06' },
		{ href: '/admin/loans', n: counts.loans, label: 'lístkov', code: '07' },
		{ href: '/admin/reservations', n: counts.reservations, label: 'rezervácií', code: '08' },
		{ href: '/admin/readers', n: counts.readers, label: 'preukazov', code: '09' },
		{
			href: '/admin/queue',
			n: hopper.ready ? hopper.queued + hopper.active : queue.waiting.length,
			label: 'v zásobníku',
			code: '11'
		}
	];

	return (
		<div className="grid gap-8">
			<div>
				<form className="pult-scan-strip" method="GET" action="/admin/scan">
					<p className="pult-scan-kicker">00 čítačka</p>
					<label>
						ISBN alebo preukaz
						<input name="q" className="rounded-full border px-3 py-2" />
					</label>
					<button type="submit">Otvoriť</button>
				</form>
				<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{cards.map((card) => (
						<Link
							key={card.href}
							href={card.href}
							className="rounded-2xl bg-card p-4 no-underline ring-1 ring-border"
						>
							<em className="font-mono text-xs">{card.code}</em>
							<strong className="font-display mt-2 block text-3xl">{card.n}</strong>
							<span className="text-muted-foreground text-sm">{card.label}</span>
						</Link>
					))}
				</div>
			</div>
			<DeskQueueBoard queue={queue} />
		</div>
	);
}
