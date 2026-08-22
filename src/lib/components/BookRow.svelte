<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook } from '$lib/types';
	import { authorLine, copiesLabel } from '$lib/format';

	let { book, index = 0 }: { book: CatalogBook; index?: number } = $props();
	const available = $derived(book.copiesAvailable > 0);
</script>

<a
	href={resolve('/knihy/[id]', { id: book.id })}
	class="book-row reveal"
	style="--spine: {book.category.accent}; --i: {index}"
>
	<span class="lamp {available ? 'on' : 'off'}" aria-hidden="true"></span>
	<span class="spine-mark" aria-hidden="true"></span>
	<div class="meta">
		<p class="kicker">{book.category.name} · {book.year}</p>
		<h2 class="font-display text-[1.85rem] leading-none tracking-tight uppercase">{book.title}</h2>
		<p class="truncate text-mute">{authorLine(book.authors)}</p>
	</div>
	<div class="flex flex-col items-start gap-1 md:items-end">
		<span class="badge {available ? 'ok' : 'off'}">{copiesLabel(book.copiesAvailable, book.copiesTotal)}</span>
		<span class="font-mono text-[0.7rem] tracking-wider text-mute">{book.callNumber}</span>
	</div>
</a>
