<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook } from '$lib/types';
	import { authorLine, copiesLabel } from '$lib/format';

	let { book, index = 0 }: { book: CatalogBook; index?: number } = $props();
	const available = $derived(book.copiesAvailable > 0);
</script>

<a
	href={resolve('/knihy/[id]', { id: book.id })}
	class="locker reveal {available ? '' : 'lock-off'}"
	style="--i: {index}"
>
	<p class="kicker">{book.category.name}</p>
	<h2 class="display mt-6 pr-6 text-[1.85rem]">{book.title}</h2>
	<p class="mt-auto pt-6 text-sm opacity-80">{authorLine(book.authors)}</p>
	<div class="mt-3 flex items-end justify-between gap-2">
		<span class="font-mono text-[0.68rem]">{book.callNumber}</span>
		<span class="rounded-full border-[3px] border-navy px-2 py-0.5 text-xs font-bold">
			{copiesLabel(book.copiesAvailable, book.copiesTotal)}
		</span>
	</div>
</a>
