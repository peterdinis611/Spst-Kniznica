<script lang="ts">
	import { resolve } from '$app/paths';
	import { booksLabel } from '$lib/format';
	import PrintJacket from '$lib/components/PrintJacket.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Odbory"
	description="Police školskej knižnice SPŠT podľa odborov. Nájdite učebnice a príručky pre svoj smer."
/>

<p class="max-w-[40ch] font-body text-[1.08rem] leading-relaxed text-muted-foreground">
	Každý odbor má vlastnú policu. Otvor značku, alebo siahni rovno po chrbte.
</p>

<ol class="mt-10 m-0 grid min-w-0 list-none gap-10 p-0">
	{#each data.categories as cat (cat.id)}
		<li class="min-w-0 border-t border-border pt-6">
			<div class="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-3">
				<a class="group min-w-0 text-inherit no-underline" href={resolve('/departments/[slug]', { slug: cat.slug })}>
					<p class="m-0 font-mono text-[0.72rem] font-semibold tracking-[0.16em] text-muted-foreground">
						{cat.code}
					</p>
					<h2
						class="font-display mt-1 text-[clamp(1.45rem,7vw,2.25rem)] leading-none font-semibold tracking-[-0.03em] group-hover:underline group-hover:underline-offset-[0.14em]"
					>
						{cat.name}
					</h2>
				</a>
				<p class="m-0 font-body text-[0.95rem] text-muted-foreground italic">
					{booksLabel(cat.bookCount)}
				</p>
			</div>
			<p class="mb-5 max-w-[46ch] font-body text-[1rem] leading-relaxed break-words text-muted-foreground">
				{cat.description}
			</p>
			{#if cat.books.length}
				<div class="shelf-rail">
					{#each cat.books as book (book.id)}
						<a class="no-underline" href={resolve('/books/[id]', { id: book.id })}>
							<span class="sm:hidden">
								<PrintJacket {book} linked={false} size="thumb" />
							</span>
							<span class="hidden sm:block">
								<PrintJacket {book} linked={false} />
							</span>
						</a>
					{/each}
					<a
						class="mb-1 inline-flex h-11 items-center rounded-full px-4 font-sans text-[0.82rem] font-semibold text-foreground no-underline hover:opacity-55"
						href={resolve('/departments/[slug]', { slug: cat.slug })}
					>
						Celá polica
					</a>
				</div>
			{/if}
		</li>
	{/each}
</ol>
