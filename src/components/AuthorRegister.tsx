'use client';

import type { AuthorSlip } from '@/types';
import { booksLabel, initials } from '@/utils/format';
import { authorSwatch } from '@/catalog/cover';
import { VirtualWindow } from './VirtualWindow';

export type AuthorLane =
	| { kind: 'letter'; id: string; letter: string }
	| { kind: 'person'; id: string; person: AuthorSlip };

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
				<em className="ml-2 text-muted-foreground not-italic">{booksLabel(person.bookCount)}</em>
			</span>
		</a>
	);
}

export function AuthorRegister({
	lanes,
	grouped,
	virtual
}: {
	lanes: AuthorLane[];
	grouped: [string, AuthorSlip[]][];
	virtual: boolean;
}) {
	if (!virtual) {
		return (
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
		);
	}

	return (
		<div className="mt-8">
			<VirtualWindow
				count={lanes.length}
				estimateSize={(index) => (lanes[index]?.kind === 'letter' ? 56 : 72)}
			>
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
	);
}
