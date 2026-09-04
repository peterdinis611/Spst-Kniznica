import { pageMeta } from '@/utils/metadata';
import { listAuthorSlips } from '@/server/library';
import { familyName } from '@/utils/format';
import type { AuthorSlip } from '@/types';
import { AuthorRegister } from '@/components/AuthorRegister';

export const metadata = pageMeta({
	title: 'Autori',
	description: 'Autori vo fonde školskej knižnice SPŠT — učebnice, príručky a povinná literatúra.'
});

export default async function AuthorsPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q = '' } = await searchParams;
	const authors = await listAuthorSlips();
	const filtered = q.trim()
		? authors.filter((person) =>
				`${person.name} ${person.role} ${familyName(person.name)}`
					.toLowerCase()
					.includes(q.trim().toLowerCase())
			)
		: authors;
	const sorted = [...filtered].sort((a, b) =>
		familyName(a.name).localeCompare(familyName(b.name), 'sk')
	);
	const map = new Map<string, AuthorSlip[]>();
	for (const person of sorted) {
		const letter = familyName(person.name).slice(0, 1).toLocaleUpperCase('sk');
		const bucket = map.get(letter) ?? [];
		bucket.push(person);
		map.set(letter, bucket);
	}
	const grouped = [...map.entries()];
	const virtual = filtered.length > 40;
	const lanes = grouped.flatMap(([letter, people]) => [
		{ kind: 'letter' as const, id: `L-${letter}`, letter },
		...people.map((person) => ({ kind: 'person' as const, id: person.id, person }))
	]);

	return (
		<>
			<p className="m-0 font-body text-[1.05rem] text-muted-foreground">
				{filtered.length.toLocaleString('sk-SK')}{' '}
				{filtered.length === 1 ? 'meno' : filtered.length < 5 ? 'mená' : 'mien'} v katalógu
				{q.trim() ? ` pre „${q.trim()}“` : ''}
				{virtual ? <span className="hidden sm:inline"> · virtualizovaný register</span> : null}
			</p>
			{grouped.length === 0 ? (
				<p className="mt-12 max-w-[32ch] font-body text-[1.1rem] text-muted-foreground">
					Nikto sa nenašiel. Skús iné meno alebo priezvisko.
				</p>
			) : (
				<AuthorRegister lanes={lanes} grouped={grouped} virtual={virtual} />
			)}
		</>
	);
}
