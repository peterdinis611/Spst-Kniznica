import { pageMeta } from '@/utils/metadata';

export const metadata = pageMeta({ title: 'Čítačka', description: 'Pultová čítačka.', index: false });

export default function AdminScanPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	return (
		<ScanInner searchParams={searchParams} />
	);
}

async function ScanInner({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
	const { q = '' } = await searchParams;
	return (
		<form method="GET" className="grid max-w-md gap-3">
			<label className="grid gap-1 text-sm">
				ISBN, signatúra alebo preukaz
				<input name="q" defaultValue={q} className="rounded-full border px-3 py-2" />
			</label>
			<button type="submit" className="rounded-full bg-primary px-4 py-2 text-primary-foreground">
				Hľadať
			</button>
			{q ? <p className="text-muted-foreground text-sm">Zásah pre „{q}“ sa sem napojí v ďalšom kroku pultu.</p> : null}
		</form>
	);
}
