<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BookSlip } from '$lib/types';
	import BookCover from './BookCover.svelte';

	let { book }: { book: BookSlip } = $props();
</script>

<a href={resolve('/books/[id]', { id: book.id })} class="block no-underline">
	<BookCover {book} size="tile" linked={false} />
	<p class="mt-3 line-clamp-2 text-sm font-semibold">{book.title}</p>
</a>
