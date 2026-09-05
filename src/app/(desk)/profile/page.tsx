import Link from 'next/link';
import { pageMeta } from '@/utils/metadata';
import { redirect } from 'next/navigation';
import { canOpenDesk } from '@/server/admin-access';
import { countActiveLoans } from '@/server/library';
import { getSessionReader } from '@/server/session';
import { readerNumber } from '@/utils/format';

export const metadata = pageMeta({
	title: 'Môj profil',
	description: 'Čitateľský preukaz školskej knižnice SPŠT.',
	index: false
});

export default async function ProfilePage() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const activeCount = await countActiveLoans(user.id);
	const admin = canOpenDesk(user);

	return (
		<section className="max-w-xl">
			<p className="font-mono text-xs tracking-[0.16em] uppercase text-muted-foreground">
				čitateľský preukaz
			</p>
			<h1 className="font-display mt-2 text-4xl">{user.name}</h1>
			<p className="mt-2 text-muted-foreground">
				{user.email} · {readerNumber(user.id)}
			</p>
			<p className="mt-6">Aktívne výpožičky: {activeCount}</p>
			<div className="mt-8 flex flex-wrap gap-3">
				<Link
					href="/loans"
					className="rounded-full bg-primary px-4 py-2 text-primary-foreground no-underline"
				>
					Moje knihy
				</Link>
				{admin ? (
					<Link href="/admin" className="rounded-full px-4 py-2 ring-1 ring-border no-underline">
						Pult
					</Link>
				) : null}
				<Link
					href="/login/recovery"
					className="rounded-full px-4 py-2 ring-1 ring-border no-underline"
				>
					Zmeniť heslo
				</Link>
			</div>
		</section>
	);
}
