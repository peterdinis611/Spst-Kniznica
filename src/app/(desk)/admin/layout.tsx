import { redirect } from 'next/navigation';
import { canOpenDesk, canOperateDesk } from '@/server/admin-access';
import { getSessionReader } from '@/server/session';
import { PultNav } from '@/components/PultNav';
import { FaultFolio } from '@/components/FaultFolio';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOpenDesk(user)) {
		return <FaultFolio status={403} message="Pult je len pre správu fondu." />;
	}
	const manage = canOperateDesk(user);

	return (
		<section className="pult">
			<header className="pult-mast">
				<p className="pult-kicker">pavilón B · kartotéka</p>
				<h1>Pult</h1>
				<p className="pult-lede">
					{manage
						? 'Správa fondu. Zásuvky sú vpredu na pulte — odbory, autori, zväzky, výtlačky a lístky.'
						: 'Trieda vonku a oneskorené lístky. Fond nemeníš — to ostáva knihovníkovi.'}
				</p>
			</header>
			<div className="pult-cabinet">
				<PultNav manage={manage} />
				<div className="pult-sheet">{children}</div>
			</div>
		</section>
	);
}
