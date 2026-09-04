import { pageMeta } from '@/utils/metadata';
import { listAuthorSlips } from '@/server/library';
import { booksLabel, familyName, initials } from '@/utils/format';
import { authorSwatch } from '@/catalog/cover';
import type { AuthorSlip } from '@/types';
import { VirtualWindow } from '@/components/VirtualWindow';

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
				`${person.name} ${person.role} ${familyName(person.name)}`.toLowerCase().includes(q.trim().toLowerCase())
			)
		: authors;
	const sorted = [...filtered].sort((a, b) => familyName(a.name).localeCompare(familyName(b.name), 'sk'));
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

	function laneSize(index: number) {
		return lanes[index]?.kind === 'letter' ? 56 : 72;
	}

	function personRow(person: AuthorSlip) {
		return (
			<a className="flex items-center gap-3 py-2 no-underline" href={`/authors/${person.slug}`}>
				<span
					className="grid size-10 place-items-center rounded-full font-display text-sm font-semibold text-white"
					style={{ background: authorSwatch(person.id) }}
				>
					{initials(person.name)}
				</span>
				<span>
					<strong className="font-display text-[1.05rem]">{person.name}</strong>
					<em className="text-muted-foreground ml-2 not-italic">{booksLabel(person.bookCount)}</em>
				</span>
			</a>
		);
	}

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
			) : virtual ? (
				<div className="mt-8">
					<VirtualWindow count={lanes.length} estimateSize={laneSize}>
						{(index) => {
							const item = lanes[index];
							if (item?.kind === 'letter') {
								return (
									<p className="mb-0 font-display text-[1.55rem] leading-none font-semibold tracking-[-0.04em] sm:text-[2rem]">
										{item.letter}
									</p>
								);
							}
							if (item?.kind === 'person') return personRow(item.person);
							return null;
						}}
					</VirtualWindow>
				</div>
			) : (
				<div className="mt-8 grid gap-8">
					{grouped.map(([letter, people]) => (
						<section key={letter}>
							<p className="mb-2 font-display text-[1.55rem] leading-none font-semibold tracking-[-0.04em] sm:text-[2rem]">
								{letter}
							</p>
							{people.map((person) => (
								<div key={person.id}>{personRow(person)}</div>
							))}
						</section>
					))}
				</div>
			)}
		</>
	);
}
