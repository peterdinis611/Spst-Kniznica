<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import BookCover from '$lib/components/BookCover.svelte';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { jacketFor } from '$lib/cover';
	import { copiesLabel, shortDate } from '$lib/format';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const book = $derived(data.book);
	const available = $derived(book.copiesAvailable > 0);
</script>

<Seo
	title={book.title}
	description={book.description}
	type="book"
	image={jacketFor(book).photo}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Book',
		name: book.title,
		isbn: book.isbn,
		numberOfPages: book.pages,
		author: book.authors.map((person) => ({ '@type': 'Person', name: person.name }))
	}}
/>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/knihy')}>Katalóg</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/odbory/[slug]', { slug: book.category.slug })}>
				{book.category.name}
			</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Page>{book.title}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<article class="mt-8 grid items-start gap-10 md:grid-cols-[auto_1fr]">
	<BookCover {book} size="hero" linked={false} />
	<div>
		<Badge variant={available ? 'secondary' : 'destructive'}>
			{copiesLabel(book.copiesAvailable, book.copiesTotal)}
		</Badge>
		<h2 class="mt-3 font-serif text-4xl font-bold md:text-5xl">{book.title}</h2>
		{#if book.subtitle}
			<p class="text-muted-foreground mt-2 text-lg">{book.subtitle}</p>
		{/if}
		<p class="mt-4">
			{#each book.authors as person, i (person.id)}
				<a
					class="font-semibold underline-offset-4 hover:underline"
					href={resolve('/autori/[slug]', { slug: person.slug })}
				>
					{person.name}
				</a>{#if i < book.authors.length - 1}, {/if}
			{/each}
		</p>
		<p class="text-muted-foreground mt-2 text-sm">
			{book.publisher}, {book.year} · {book.pages} s. · ISBN {book.isbn} · {book.callNumber}
		</p>
		<p class="mt-5 max-w-xl font-serif text-lg leading-relaxed">{book.description}</p>
		<Separator class="my-6" />

		{#if form && 'message' in form && form.message}
			<Alert.Root variant="destructive" class="mb-4">
				<Alert.Title>Nešlo to</Alert.Title>
				<Alert.Description>{form.message}</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="flex flex-wrap items-center justify-between gap-3">
			{#if data.userLoan}
				<p class="text-sm">U teba do <strong>{shortDate(data.userLoan.dueAt)}</strong></p>
				<Button href={resolve('/vypozicky')}>Vrátiť v Moja knižnica</Button>
			{:else if !data.user}
				<p class="text-muted-foreground text-sm">Na výpožičku treba účet.</p>
				<Button href={resolve('/prihlasenie')}>Prihlásiť sa</Button>
			{:else}
				<p class="text-muted-foreground text-sm">
					{#if !available}
						Momentálne nie je voľný výtlačok.
					{:else if data.activeCount >= data.maxLoans}
						Limit {data.maxLoans} výpožičiek je plný.
					{:else}
						21 dní · {data.activeCount}/{data.maxLoans} obsadených
					{/if}
				</p>
				<form method="POST" action="?/borrow" use:enhance>
					<Button type="submit" disabled={!available || data.activeCount >= data.maxLoans}>
						Vypožičať
					</Button>
				</form>
			{/if}
		</div>
	</div>
</article>

{#if data.related.length}
	<section class="mt-14">
		<h2 class="text-xl font-bold">Ďalšie z odboru</h2>
		<div class="cover-grid mt-5">
			{#each data.related as item (item.id)}
				<LockerCard book={item} />
			{/each}
		</div>
	</section>
{/if}
