<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook } from '$lib/types';
	import { authorLine, copiesLabel } from '$lib/format';

	let { book, index = 0 }: { book: CatalogBook; index?: number } = $props();
	const available = $derived(book.copiesAvailable > 0);
</script>

<a
	href={resolve('/knihy/[id]', { id: book.id })}
	class="panel reveal block p-5 no-underline"
	style="--i: {index}"
>
	<div class="flex items-start justify-between gap-3">
		<span class="badge {available ? 'ok' : 'off'}">{copiesLabel(book.copiesAvailable, book.copiesTotal)}</span>
		<span class="spine-mark h-8" style="--spine: {book.category.accent}"></span>
	</div>
	<p class="kicker mt-5">{book.category.name}</p>
	<h2 class="font-display mt-2 text-[2rem] leading-none uppercase">{book.title}</h2>
	<p class="mt-3 text-mute">{authorLine(book.authors)}</p>
	<p class="mt-4 font-mono text-[0.7rem] tracking-wider text-mute">{book.callNumber}</p>
</a>
