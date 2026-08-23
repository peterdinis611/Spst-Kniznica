<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BookSlip } from '$lib/types';
	import { authorLine } from '$lib/format';

	let { book }: { book: BookSlip } = $props();
</script>

<a
	href={resolve('/books/[id]', { id: book.id })}
	class="spine"
	style="--spine: {book.category.accent}"
	title="{book.title} — {authorLine(book.authors)}"
>
	<span class="text-[0.65rem]">{book.category.code}</span>
	<span class="text-[0.95rem] leading-tight">{book.title}</span>
	<span class="text-[0.65rem]">{authorLine(book.authors).split(' ').at(-1)}</span>
</a>
