<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook } from '$lib/types';
	import { authorLine } from '$lib/format';
	import { authorLast, jacketFor } from '$lib/cover';
	import { cn } from '$lib/utils.js';

	let {
		book,
		size = 'rail',
		linked = true
	}: {
		book: CatalogBook;
		size?: 'rail' | 'tile' | 'thumb' | 'hero';
		linked?: boolean;
	} = $props();

	const tone = $derived(jacketFor(book));
	const href = $derived(resolve('/knihy/[id]', { id: book.id }));
	const author = $derived(authorLast(authorLine(book.authors)));
	const sizes = {
		rail: 'h-[15.5rem] w-[10.4rem] p-4 md:h-[17.2rem] md:w-[11.4rem]',
		tile: 'aspect-[2/3] w-full p-4',
		thumb: 'h-[7.4rem] w-[5rem] p-2',
		hero: 'h-[22rem] w-[15rem] p-6'
	};
</script>

<svelte:element
	this={linked ? 'a' : 'div'}
	href={linked ? href : undefined}
	class={cn('jacket', sizes[size])}
	style="background: {tone.bg}; color: {tone.fg}"
	title="{book.title} — {authorLine(book.authors)}"
>
	<span class="text-[0.62rem] font-semibold tracking-[0.18em] uppercase" style="color: {tone.ink}">
		{book.category.code}
	</span>
	<div class="min-h-0">
		{#if tone.pattern === 'band'}
			<div class="mb-2 h-1.5 w-10 rounded-full" style="background: {tone.band}"></div>
		{/if}
		{#if tone.pattern === 'stamp'}
			<div
				class="mb-2 size-8 rounded-full border"
				style="border-color: {tone.ink}; box-shadow: inset 0 0 0 3px {tone.bg}, inset 0 0 0 4px {tone.ink}"
			></div>
		{/if}
		<p
			class={cn(
				'font-serif leading-[1.12] font-bold',
				size === 'thumb' ? 'text-[0.62rem]' : size === 'hero' ? 'text-[1.45rem]' : 'text-[1.05rem]'
			)}
		>
			{book.title}
		</p>
		{#if tone.pattern === 'rule' && size !== 'thumb'}
			<div class="mt-3 h-px w-12" style="background: {tone.ink}"></div>
		{/if}
	</div>
	{#if size !== 'thumb'}
		<p class="text-[0.68rem] tracking-wide uppercase opacity-80">{author}</p>
	{/if}
</svelte:element>
