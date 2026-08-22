<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import { copiesLabel, shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const book = $derived(data.book);
	const available = $derived(book.copiesAvailable > 0);
</script>

<svelte:head>
	<title>{book.title} · SPŠT Knižnica</title>
</svelte:head>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<article class="wrap pt-8">
	<nav class="kicker flex flex-wrap gap-2">
		<a href={resolve('/knihy')}>Knihy</a>
		<span>/</span>
		<a href={resolve('/odbory/[slug]', { slug: book.category.slug })}>{book.category.name}</a>
	</nav>

	<div class="id-card reveal mt-4 overflow-hidden md:grid md:grid-cols-2">
		<div class="relative min-h-[14rem] p-7 text-navy" style="background: {book.category.accent}22">
			<div
				class="absolute right-6 top-6 h-8 w-8 rounded-full border-[3px] border-navy {available
					? 'bg-mint'
					: 'bg-coral'}"
			></div>
			<p class="kicker">{book.callNumber}</p>
			<p class="mt-16 font-mono text-sm">ISBN {book.isbn}</p>
			<p class="mt-2">{book.publisher}, {book.year} · {book.pages} s.</p>
		</div>

		<div class="p-7 md:p-8">
			<h1 class="display text-4xl md:text-5xl">{book.title}</h1>
			{#if book.subtitle}
				<p class="mt-2 text-lg opacity-80">{book.subtitle}</p>
			{/if}
			<p class="mt-4">
				{#each book.authors as person, i (person.id)}
					<a class="font-bold underline decoration-2 underline-offset-4" href={resolve('/autori/[slug]', { slug: person.slug })}>
						{person.name}
					</a>{#if i < book.authors.length - 1}, {/if}
				{/each}
			</p>
			<p class="mt-5 opacity-85">{book.description}</p>
			<p class="kicker mt-5">{copiesLabel(book.copiesAvailable, book.copiesTotal)}</p>

			<div class="borrow-bar relative bottom-0 mt-6 shadow-none">
				{#if data.userLoan}
					<p>U teba do <b>{shortDate(data.userLoan.dueAt)}</b></p>
					<a href={resolve('/vypozicky')} class="btn">Vrátiť</a>
				{:else if !data.user}
					<p>Najprv sa prihlás.</p>
					<a href={resolve('/prihlasenie')} class="btn">Prihlás sa</a>
				{:else}
					<div>
						<p class="text-sm">
							{#if !available}
								Táto skrinka je práve prázdna.
							{:else if data.activeCount >= data.maxLoans}
								Máš plný batoh ({data.maxLoans}).
							{:else}
								21 dní · {data.activeCount}/{data.maxLoans} v batohu
							{/if}
						</p>
						{#if form && 'message' in form && form.message}
							<p class="text-coral">{form.message}</p>
						{/if}
					</div>
					<form method="POST" action="?/borrow" use:enhance>
						<button class="btn" type="submit" disabled={!available || data.activeCount >= data.maxLoans}>
							Beriem si ju
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</article>

{#if data.related.length}
	<section class="wrap mt-12">
		<h2 class="display text-3xl">Susedné skrinky</h2>
		<div class="locker-grid mt-5">
			{#each data.related as item, i (item.id)}
				<LockerCard book={item} index={i} />
			{/each}
		</div>
	</section>
{/if}
