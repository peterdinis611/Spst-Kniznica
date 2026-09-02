<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, booksLabel, copiesLabel, initials, splitCallNumber } from '$lib/format';
	import { authorSwatch } from '$lib/cover';
	import { cn } from '$lib/utils.js';
	import PrintJacket from '$lib/components/PrintJacket.svelte';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(data.featured);
	const featuredCall = $derived(featured ? splitCallNumber(featured.callNumber) : null);
	const catalog = $derived(
		data.books.filter((book) => book.id !== 'book-modlitbicky' && book.id !== featured?.id)
	);
	const ready = $derived(catalog.filter((book) => book.copiesAvailable > 0));
	const shelf = $derived(ready.slice(0, 24));
	const authors = $derived(
		[...data.authors].sort((a, b) => b.bookCount - a.bookCount).slice(0, 16)
	);

	const display =
		'font-display m-0 font-semibold tracking-[-0.03em] leading-[1.06] [font-variation-settings:"SOFT"_28,"WONK"_0]';
	const rise =
		'animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 motion-reduce:animate-none';
</script>

<Seo
	title="Objavovať"
	description="Odporúčané knihy, police odborov a novinky vo fonde školskej knižnice SPŠT."
/>

<div class="text-foreground pt-1 sm:pt-2">
	{#if featured && featuredCall}
		<section
			data-tour="featured"
			class={cn(
				'relative overflow-hidden rounded-[1.7rem] bg-[#3c2a21] text-[#f6f0e6]',
				'dark:bg-[#1c1713] dark:text-[#f3eadf] dark:shadow-[inset_0_0_0_1px_rgb(196_90_56_/_0.35)]',
				'bg-[radial-gradient(ellipse_at_18%_0%,rgb(196_90_56/0.22),transparent_42%),linear-gradient(180deg,transparent_70%,rgb(0_0_0/0.12))]',
				rise
			)}
		>
			<div
				class="grid grid-cols-1 items-end gap-3.5 px-4 py-4 min-[420px]:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8 sm:px-6 sm:py-8 md:gap-12 md:px-10 md:py-10 lg:grid-cols-[auto_minmax(0,1fr)_11.5rem]"
			>
				<a
					class="group w-fit no-underline"
					href={resolve('/books/[id]', { id: featured.id })}
				>
					<span class="block origin-bottom transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:-rotate-2 motion-reduce:transform-none">
						<span class="sm:hidden">
							<PrintJacket
								book={featured}
								size="thumb"
								linked={false}
								class="shadow-[6px_10px_0_rgb(0_0_0/0.16)] ring-0 hover:!transform-none"
							/>
						</span>
						<span class="hidden sm:block">
							<PrintJacket
								book={featured}
								size="feature"
								linked={false}
								class="shadow-[12px_18px_0_rgb(0_0_0/0.18)] ring-0 hover:!transform-none"
							/>
						</span>
					</span>
					<span class="mx-auto mt-3 hidden h-2 w-[10.5rem] rounded-full bg-[rgb(0_0_0/0.22)] blur-[2px] sm:block"></span>
				</a>
				<div class="min-w-0 pb-0.5">
					<p class="m-0 font-sans text-[0.62rem] font-semibold tracking-[0.16em] uppercase opacity-65 sm:text-[0.72rem] sm:tracking-[0.18em]">
						Dnes na pulte
					</p>
					<h2 class={cn(display, 'mt-1.5 max-w-[14ch] text-[clamp(1.35rem,6.4vw,3.5rem)] sm:mt-3')}>
						<a
							class="text-inherit no-underline decoration-from-font hover:underline"
							href={resolve('/books/[id]', { id: featured.id })}
						>
							{featured.title}
						</a>
					</h2>
					<p class="mt-2 m-0 line-clamp-2 font-body text-[0.92rem] leading-snug opacity-85 sm:mt-4 sm:text-[1.12rem]">
						{authorLine(featured.authors)}
						<span class="mx-1.5">·</span>
						{featured.category.name}
					</p>
					<p class="mt-4 m-0 hidden max-w-[38ch] font-body text-[1.05rem] leading-relaxed opacity-75 sm:block">
						{featured.description}
					</p>
					<div class="mt-3 flex flex-wrap items-center gap-2 sm:mt-7 sm:gap-3">
						<a
							class="hidden h-11 items-center rounded-full bg-[#f6f0e6] px-6 font-sans text-[0.9rem] font-semibold text-[#3c2a21] no-underline hover:opacity-90 sm:inline-flex dark:bg-[#c45a38] dark:text-[#fff6ec]"
							href={resolve('/books/[id]', { id: featured.id })}
						>
							Pozrieť knihu
						</a>
						<span
							class="inline-flex h-8 items-center rounded-full bg-[rgb(255_248_230/0.14)] px-3 font-sans text-[0.68rem] font-semibold tracking-wide sm:h-11 sm:px-4 sm:text-[0.78rem]"
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
		data-tour="odbory"
		class={cn(
			'mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border pb-4 delay-75',
			rise
		)}
		aria-label="Odbory"
	>
		<a
			class="font-sans text-[0.78rem] font-semibold tracking-[0.08em] text-foreground uppercase no-underline hover:opacity-55"
			href={resolve('/departments')}
		>
			Všetky
		</a>
		{#each data.categories as cat (cat.id)}
			<a
				class="font-mono text-[0.78rem] font-semibold tracking-[0.08em] text-foreground no-underline hover:opacity-55"
				href={resolve('/departments/[slug]', { slug: cat.slug })}
			>
				{cat.code}
				<span class="ml-1 text-foreground/65">{cat.bookCount}</span>
			</a>
		{/each}
		<span class="hidden font-body text-[0.92rem] text-foreground/70 sm:ml-auto sm:inline">
			{data.stats.available} voľných · {data.stats.books} zväzkov
		</span>
	</nav>

	<section
		class={cn('mt-14 scroll-mt-[6.75rem] pt-2 sm:mt-16 sm:scroll-mt-8 sm:pt-4 delay-150', rise)}
		data-tour="shelf"
	>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-4">
			<div class="min-w-0">
				<p class="m-0 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/75 uppercase">
					Práve vo fonde
				</p>
				<h2 class={cn(display, 'mt-1.5 min-w-0 text-[clamp(1.55rem,6vw,2.35rem)]')}>Voľné na polici.</h2>
			</div>
			<a
				class="font-sans text-[0.82rem] font-semibold tracking-[0.04em] text-foreground no-underline hover:opacity-55"
				href={resolve('/holdings')}
			>
				Celý register
			</a>
		</div>
		<p class="mb-5 max-w-[34ch] font-body text-[1.02rem] leading-relaxed text-foreground/80">
			Otoč zväzok šípami alebo ťahaním. Vybraný sa vysunie.
		</p>
		<CoverRail books={shelf} />
	</section>

	<section class={cn('mt-12 delay-150', rise)}>
		<div class="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
			<div class="min-w-0">
				<p class="m-0 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-foreground/75 uppercase">
					Menný katalóg
				</p>
				<h2 class={cn(display, 'mt-1 text-[clamp(1.45rem,6vw,2.2rem)]')}>Autori vo fonde.</h2>
			</div>
			<a
				class="font-sans text-[0.82rem] font-semibold text-foreground no-underline hover:opacity-55"
				href={resolve('/authors')}
			>
				Všetci autori
			</a>
		</div>
		<ul class="m-0 grid list-none gap-x-10 p-0 sm:grid-cols-2">
			{#each authors as author (author.id)}
				<li class="border-t border-border">
					<a
						class="group flex items-center gap-3.5 py-4 text-inherit no-underline"
						href={resolve('/authors/[slug]', { slug: author.slug })}
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
							<em class="mt-0.5 block font-body text-[0.88rem] text-foreground/70 italic">
								{booksLabel(author.bookCount)}
							</em>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
