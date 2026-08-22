<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, booksLabel, copiesLabel, initials, splitCallNumber } from '$lib/format';
	import { authorSwatch } from '$lib/cover';
	import { cn } from '$lib/utils.js';
	import PrintJacket from '$lib/components/PrintJacket.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(
		data.featured?.id === 'book-modlitbicky' ? data.books[0] : data.featured
	);
	const featuredCall = $derived(featured ? splitCallNumber(featured.callNumber) : null);
	const catalog = $derived(
		data.books.filter((book) => book.id !== 'book-modlitbicky' && book.id !== featured?.id)
	);
	const ready = $derived(catalog.filter((book) => book.copiesAvailable > 0));
	const shelf = $derived(ready.slice(0, 7));
	const rest = $derived(catalog.filter((book) => !shelf.some((item) => item.id === book.id)).slice(0, 6));
	const authors = $derived(
		[...data.authors].sort((a, b) => b.bookCount - a.bookCount).slice(0, 8)
	);

	const heights = [13.8, 12.2, 15, 12.8, 14.4, 12.5, 14.8];
	const display =
		'font-display m-0 font-semibold tracking-[-0.03em] leading-[1.06] [font-variation-settings:"SOFT"_28,"WONK"_0]';
	const rise =
		'animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 motion-reduce:animate-none';
</script>

<Seo
	title="Objavovať"
	description="Odporúčané knihy, police odborov a novinky vo fonde školskej knižnice SPŠT."
/>

<div class="text-foreground">
	{#if featured && featuredCall}
		<section
			class={cn(
				'relative overflow-hidden rounded-[1.7rem] bg-primary text-primary-foreground',
				'bg-[radial-gradient(ellipse_at_18%_0%,rgb(255_248_230/0.16),transparent_42%),linear-gradient(180deg,transparent_70%,rgb(0_0_0/0.12))]',
				rise
			)}
		>
			<div
				class="grid items-center gap-8 px-6 py-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12 md:px-10 md:py-10 lg:grid-cols-[auto_minmax(0,1fr)_11.5rem]"
			>
				<a
					class="group justify-self-center no-underline md:justify-self-start"
					href={resolve('/knihy/[id]', { id: featured.id })}
				>
					<span class="block origin-bottom transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-2 motion-reduce:transform-none">
						<PrintJacket
							book={featured}
							size="feature"
							linked={false}
							class="shadow-[12px_18px_0_rgb(0_0_0/0.18)] ring-0 hover:!transform-none"
						/>
					</span>
					<span class="mx-auto mt-3 block h-2 w-[10.5rem] rounded-full bg-[rgb(0_0_0/0.22)] blur-[2px]"></span>
				</a>
				<div class="min-w-0">
					<p class="m-0 font-sans text-[0.72rem] font-semibold tracking-[0.18em] uppercase opacity-65">
						Dnes na pulte
					</p>
					<h2 class={cn(display, 'mt-3 max-w-[12ch] text-[clamp(2.2rem,4.6vw,3.5rem)]')}>
						<a
							class="text-inherit no-underline decoration-from-font hover:underline"
							href={resolve('/knihy/[id]', { id: featured.id })}
						>
							{featured.title}
						</a>
					</h2>
					<p class="mt-4 m-0 font-body text-[1.12rem] leading-snug opacity-85">
						{authorLine(featured.authors)}
						<span class="mx-1.5">·</span>
						{featured.category.name}
					</p>
					<p class="mt-4 m-0 max-w-[38ch] font-body text-[1.05rem] leading-relaxed opacity-75">
						{featured.description}
					</p>
					<div class="mt-7 flex flex-wrap items-center gap-3">
						<a
							class="inline-flex h-11 items-center rounded-full bg-card px-6 font-sans text-[0.9rem] font-semibold text-card-foreground no-underline hover:opacity-90"
							href={resolve('/knihy/[id]', { id: featured.id })}
						>
							Pozrieť knihu
						</a>
						<span
							class="inline-flex h-11 items-center rounded-full bg-[rgb(255_248_230/0.14)] px-4 font-sans text-[0.78rem] font-semibold tracking-wide"
						>
							{copiesLabel(featured.copiesAvailable, featured.copiesTotal)}
						</span>
					</div>
				</div>
				<aside
					class="hidden min-h-[14rem] flex-col justify-between border-l border-[rgb(255_248_230/0.16)] pl-7 lg:flex"
				>
					<div>
						<p class="m-0 font-mono text-[0.68rem] font-semibold tracking-[0.16em] uppercase opacity-55">
							Signatúra
						</p>
						<p class="mt-3 m-0 font-mono text-[1.35rem] leading-none font-semibold tracking-tight">
							{featuredCall.dept}
						</p>
						<p class="mt-2 m-0 font-mono text-[0.95rem] opacity-75">
							{featuredCall.number}
							{featuredCall.cutter}
						</p>
					</div>
					<p class="m-0 font-body text-[0.95rem] leading-snug opacity-70">
						{featured.category.name}<br />
						{featured.pages} strán · {featured.year}
					</p>
				</aside>
			</div>
		</section>
	{/if}

	<nav
		class={cn(
			'mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border pb-4 delay-75',
			rise
		)}
		aria-label="Odbory"
	>
		<a
			class="font-sans text-[0.78rem] font-semibold tracking-[0.08em] text-foreground uppercase no-underline hover:opacity-55"
			href={resolve('/odbory')}
		>
			Všetky
		</a>
		{#each data.categories as cat (cat.id)}
			<a
				class="font-mono text-[0.78rem] font-semibold tracking-[0.08em] text-foreground no-underline hover:opacity-55"
				href={resolve('/odbory/[slug]', { slug: cat.slug })}
			>
				{cat.code}
				<span class="ml-1 text-muted-foreground">{cat.bookCount}</span>
			</a>
		{/each}
		<span class="ml-auto font-body text-[0.92rem] text-muted-foreground">
			{data.stats.available} voľných · {data.stats.books} zväzkov
		</span>
	</nav>

	<section class={cn('mt-9 delay-150', rise)}>
		<div class="mb-5 flex items-end justify-between gap-4">
			<h2 class={cn(display, 'text-[clamp(1.6rem,3vw,2.2rem)]')}>Voľné na polici.</h2>
			<a
				class="font-sans text-[0.82rem] font-semibold tracking-[0.04em] text-foreground no-underline hover:opacity-55"
				href={resolve('/knihy')}
			>
				Celý katalóg
			</a>
		</div>
		<div class="-mx-1 flex items-end gap-3 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			{#each shelf as book, i (book.id)}
				<a class="shrink-0 no-underline" href={resolve('/knihy/[id]', { id: book.id })}>
					<PrintJacket {book} linked={false} height="{heights[i % heights.length]}rem" />
				</a>
			{/each}
		</div>
	</section>

	{#if rest.length}
		<section class={cn('mt-10 delay-150', rise)}>
			<ol class="m-0 grid list-none gap-x-10 gap-y-0 p-0 md:grid-cols-2">
				{#each rest as book (book.id)}
					<li class="border-t border-border">
						<a
							class="group grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 py-4 text-inherit no-underline"
							href={resolve('/knihy/[id]', { id: book.id })}
						>
							<em class="font-sans text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground not-italic uppercase">
								{book.category.code}
							</em>
							<span class="min-w-0">
								<strong class="block font-display text-[1.15rem] leading-tight font-semibold group-hover:underline group-hover:underline-offset-[0.16em]">
									{book.title}
								</strong>
								<span class="mt-1 block font-body text-[0.95rem] text-muted-foreground">
									{authorLine(book.authors)}
									<span class="mx-1.5 text-foreground">·</span>
									{copiesLabel(book.copiesAvailable, book.copiesTotal)}
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<section class={cn('mt-12 delay-150', rise)}>
		<div class="mb-5 flex items-end justify-between gap-4">
			<div>
				<p class="m-0 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
					Menný katalóg
				</p>
				<h2 class={cn(display, 'mt-1 text-[clamp(1.6rem,3vw,2.2rem)]')}>Autori vo fonde.</h2>
			</div>
			<a
				class="font-sans text-[0.82rem] font-semibold text-foreground no-underline hover:opacity-55"
				href={resolve('/autori')}
			>
				Všetci autori
			</a>
		</div>
		<ul class="m-0 grid list-none gap-x-10 p-0 sm:grid-cols-2">
			{#each authors as author (author.id)}
				<li class="border-t border-border">
					<a
						class="group flex items-center gap-3.5 py-4 text-inherit no-underline"
						href={resolve('/autori/[slug]', { slug: author.slug })}
					>
						<span
							class="grid size-10 shrink-0 place-items-center rounded-full font-sans text-[0.7rem] font-bold text-[#fffaf3]"
							style="background: {authorSwatch(author.id)}"
						>
							{initials(author.name)}
						</span>
						<span class="min-w-0 flex-1">
							<strong class="block truncate font-display text-[1.08rem] leading-tight font-semibold group-hover:underline group-hover:underline-offset-[0.16em]">
								{author.name}
							</strong>
							<em class="mt-0.5 block font-body text-[0.88rem] text-muted-foreground italic">
								{booksLabel(author.bookCount)}
							</em>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
