<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine } from '$lib/format';
	import { authorLast, clothFor } from '$lib/cover';
	import { cn } from '$lib/utils.js';
	import type { CatalogBook } from '$lib/types';

	let {
		book,
		size = 'shelf',
		linked = true,
		height,
		class: className
	}: {
		book: CatalogBook;
		size?: 'feature' | 'shelf' | 'thumb';
		linked?: boolean;
		height?: string;
		class?: string;
	} = $props();

	const cloth = $derived(clothFor(book.id));
	const href = $derived(resolve('/books/[id]', { id: book.id }));
	const author = $derived(authorLast(authorLine(book.authors)));
</script>

<svelte:element
	this={linked ? 'a' : 'div'}
	href={linked ? href : undefined}
	class={cn(
		'jacket relative block overflow-hidden rounded-[0.7rem] no-underline shadow-[8px_14px_0_rgb(60_42_33/0.12)] dark:shadow-[8px_14px_0_rgb(0_0_0/0.35)]',
		size === 'feature' && 'h-[18rem] w-[12.2rem]',
		size === 'shelf' && 'w-[8.6rem]',
		size === 'shelf' && !height && 'h-[13.4rem]',
		size === 'thumb' && 'h-[8.4rem] w-[5.4rem] rounded-[0.45rem] shadow-[5px_10px_0_rgb(40_28_16/0.16)] dark:shadow-[5px_10px_0_rgb(0_0_0/0.4)]',
		className
	)}
	style="background: {cloth.bg}; color: {cloth.ink};{height ? ` height: ${height}` : ''}"
	title="{book.title} — {authorLine(book.authors)}"
>
	<span
		class="pointer-events-none absolute inset-0 opacity-40"
		style="background: linear-gradient(90deg, rgb(0 0 0 / 0.18), transparent 28%, rgb(255 255 255 / 0.16) 72%, rgb(0 0 0 / 0.08))"
	></span>
	<span
		class="absolute top-[30%] right-0 left-0 h-[3px]"
		style="background: {cloth.band}"
	></span>
	<div
		class={cn(
			'relative flex h-full flex-col justify-between',
			size === 'thumb' ? 'p-2' : 'p-3.5'
		)}
	>
		<span
			class={cn(
				'font-mono font-semibold tracking-[0.14em] uppercase opacity-70',
				size === 'thumb' ? 'text-[0.5rem]' : 'text-[0.62rem]'
			)}
		>
			{book.category.code}
		</span>
		<div>
			<p
				class={cn(
					'font-display leading-[1.12] font-semibold tracking-[-0.03em] [font-variation-settings:"SOFT"_28,"WONK"_0]',
					size === 'feature' && 'text-[1.35rem]',
					size === 'shelf' && 'text-[1.02rem]',
					size === 'thumb' && 'line-clamp-3 text-[0.72rem]'
				)}
			>
				{book.title}
			</p>
			<p
				class={cn(
					'font-sans font-semibold tracking-[0.12em] uppercase opacity-70',
					size === 'thumb' ? 'mt-1 text-[0.48rem]' : 'mt-2 text-[0.62rem]'
				)}
			>
				{author}
			</p>
		</div>
	</div>
</svelte:element>
