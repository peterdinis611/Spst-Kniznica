import { pageMeta } from '@/utils/metadata';
import { listSpineLabels } from '@/server/desk/holdings';
import { PrintButton } from '@/components/pult/PrintButton';
import { PultSearch } from '@/components/pult/PultSearch';

export const metadata = pageMeta({
	title: 'Štítky na chrbát',
	description: 'Signatúra a inventár na papier, ktorý ide na knihu.',
	index: false
});

export default async function SpineLabelsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q = '' } = await searchParams;
	const rows = await listSpineLabels(q);

	return (
		<>
			<p className="pult-queue-kicker">06 štítky</p>
			<div className="pult-toolbar">
				<PultSearch
					query={q}
					placeholder="inventár, signatúra, názov"
					path="/admin/holdings/labels"
				/>
				<PrintButton />
			</div>
			<p className="pult-lede">Signatúra a inventár na papier, ktorý ide na chrbát.</p>
			{rows.length === 0 ? (
				<p className="pult-empty">Žiadny výtlačok na štítok.</p>
			) : (
				<div className="spine-folio">
					{rows.map((row) => (
						<article key={row.id} className="spine-ticket">
							<em>{row.categoryCode}</em>
							<strong>{row.callNumber}</strong>
							<span>{row.inventoryNo}</span>
							<small>{row.title}</small>
						</article>
					))}
				</div>
			)}
		</>
	);
}
