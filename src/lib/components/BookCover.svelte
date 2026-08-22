<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook } from '$lib/types';
	import { authorLine } from '$lib/format';
	import { authorLast, jacketFor } from '$lib/cover';
	import { cn } from '$lib/utils.js';
	import OptimizedImage from './OptimizedImage.svelte';

	let {
		book,
		size = 'rail',
		linked = true,
		plain = false
	}: {
		book: CatalogBook;
		size?: 'rail' | 'tile' | 'thumb' | 'hero';
		linked?: boolean;
		plain?: boolean;
	} = $props();

	const tone = $derived(jacketFor(book));
	const href = $derived(resolve('/books/[id]', { id: book.id }));
	const author = $derived(authorLast(authorLine(book.authors)));
	const sizes = {
		rail: 'h-[16.8rem] w-[11.2rem] md:h-[18.4rem] md:w-[12.2rem]',
		tile: 'aspect-[2/3] w-full',
		thumb: 'h-[6.6rem] w-[4.5rem]',
		hero: 'h-[22rem] w-[14.8rem]'
	};
</script>

<svelte:element
	this={linked ? 'a' : 'div'}
	href={linked ? href : undefined}
	class={cn('jacket', sizes[size])}
	style="background: {tone.bg}"
	title="{book.title} — {authorLine(book.authors)}"
>
	<OptimizedImage
		src={tone.photo}
		preset={size === 'hero' ? 'hero' : size === 'thumb' ? 'thumb' : size === 'tile' ? 'tile' : 'rail'}
		eager={size === 'hero'}
		class="absolute inset-0 size-full"
		fallbackLabel={book.title}
		fallbackBg={tone.bg}
		fallbackFg={tone.fg}
	/>
	<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5"></div>
	{#if size !== 'thumb' && !plain}
		<div class="absolute inset-x-0 bottom-0 p-3 text-white">
			<p
				class={cn(
					'leading-[1.15] font-extrabold',
					size === 'hero' ? 'text-2xl' : 'text-[0.95rem]'
				)}
			>
				{book.title}
			</p>
			<p class="mt-1 text-[0.65rem] tracking-wide uppercase opacity-80">{author}</p>
		</div>
	{/if}
</svelte:element>
