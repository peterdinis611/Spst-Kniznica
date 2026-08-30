<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import BookCover from '$lib/components/BookCover.svelte';
	import BorrowSlip from '$lib/components/BorrowSlip.svelte';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { jacketFor } from '$lib/cover';
	import { copiesLabel, loanedLabel, shortDate } from '$lib/format';
	import {
		hasBorrowErrors,
		normalizeClass,
		parseLoanDays,
		type BorrowErrors
	} from '$lib/borrow-fields';
	import { Button } from '$lib/components/ui/button/index.js';
	import { applyToast } from '$lib/form-kit';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const book = $derived(data.book);
	const available = $derived(book.copiesAvailable > 0);
	const atLimit = $derived(data.maxLoans != null && data.activeCount >= data.maxLoans);
	const formValues = $derived(form && 'values' in form ? form.values : undefined);
	const formErrors = $derived(
		(form && 'errors' in form ? form.errors : undefined) as BorrowErrors | undefined
	);
	const borrower = $derived({
		firstName: formValues?.firstName ?? data.borrower.firstName,
		lastName: formValues?.lastName ?? data.borrower.lastName,
		className: formValues?.className ? normalizeClass(formValues.className) : data.borrower.className,
		days: parseLoanDays(formValues?.days ?? '') ?? data.borrower.days
	});
	const slipFail = $derived(
		Boolean(form && 'errors' in form && hasBorrowErrors(form.errors ?? {}))
	);
	let slipOpen = $state(false);

	$effect(() => {
		if (form && 'stamp' in form && form.stamp) slipOpen = false;
		else if (form && 'errors' in form) slipOpen = true;
	});
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
			<Breadcrumb.Link href={resolve('/books')}>Katalóg</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/departments/[slug]', { slug: book.category.slug })}>
				{book.category.name}
			</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item class="min-w-0">
			<Breadcrumb.Page class="block max-w-[16ch] truncate sm:max-w-[28ch]">{book.title}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<article class="mt-5 grid items-start justify-items-center gap-5 sm:mt-8 sm:gap-10 md:grid-cols-[auto_1fr] md:justify-items-stretch">
	<BookCover {book} size="hero" linked={false} />
	<div class="min-w-0 w-full">
		<Badge variant={available ? 'secondary' : 'destructive'}>
			{copiesLabel(book.copiesAvailable, book.copiesTotal)}
		</Badge>
		<h2 class="mt-3 font-serif text-[1.7rem] leading-[1.05] font-bold break-words sm:text-[2.05rem] md:text-5xl">{book.title}</h2>
		{#if book.subtitle}
			<p class="text-muted-foreground mt-2 text-lg">{book.subtitle}</p>
		{/if}
		<p class="mt-4">
			{#each book.authors as person, i (person.id)}
				<a
					class="font-semibold underline-offset-4 hover:underline"
					href={resolve('/authors/[slug]', { slug: person.slug })}
				>
					{person.name}
				</a>{#if i < book.authors.length - 1}, {/if}
			{/each}
		</p>
		<p class="text-muted-foreground mt-2 text-sm break-words">
			{book.publisher}, {book.year} · {book.pages} s. · ISBN {book.isbn} · {book.callNumber}
		</p>
		<p class="mt-5 max-w-xl font-serif text-[1.05rem] leading-relaxed sm:text-lg">{book.description}</p>
		<Separator class="my-6" />

		{#if form && 'message' in form && form.message && !slipFail}
			<Alert.Root variant="destructive" class="mb-4">
				<Alert.Title>Nešlo to</Alert.Title>
				<Alert.Description>{form.message}</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
			{#if data.userLoan}
				<p class="text-sm">U teba do <strong>{shortDate(data.userLoan.dueAt)}</strong></p>
				<Button href={resolve('/loans')}>Vrátiť v Moja knižnica</Button>
			{:else if data.wait?.status === 'fulfilled'}
				<p class="text-sm">
					Výtlačok je na pulte do <strong>{shortDate(data.wait.expiresAt)}</strong>.
				</p>
				<Button type="button" onclick={() => (slipOpen = true)}>Vypožičať</Button>
				<BorrowSlip
					title={book.title}
					defaults={borrower}
					errors={formErrors ?? {}}
					message={form && 'errors' in form ? form.message : ''}
					bind:open={slipOpen}
				/>
			{:else if data.wait?.status === 'pending'}
				<p class="text-muted-foreground text-sm">Čakací lístok je na pulte. Ozveme sa, keď sa výtlačok vráti.</p>
				<Button href={resolve('/loans')} variant="outline">Otvoriť lístok</Button>
			{:else if !data.user}
				<p class="text-muted-foreground text-sm">
					{#if !available}
						Momentálne nie je voľný výtlačok. Po prihlásení necháš čakací lístok.
					{:else}
						Na výpožičku treba účet.
					{/if}
				</p>
				<Button href={resolve('/login')}>Prihlásiť sa</Button>
			{:else if data.heldForOther}
				<p class="text-muted-foreground text-sm">Výtlačok čaká na iného čitateľa. Skús neskôr, alebo nechaj čakací lístok.</p>
				<form method="POST" action="?/reserve" use:enhance={applyToast()}>
					<Button type="submit" variant="outline">Položiť čakací lístok</Button>
				</form>
			{:else if !available}
				<p class="text-muted-foreground text-sm">Momentálne nie je voľný výtlačok. Lístok ťa zaradí do radu.</p>
				<form method="POST" action="?/reserve" use:enhance={applyToast()}>
					<Button type="submit">Položiť čakací lístok</Button>
				</form>
			{:else if atLimit}
				<p class="text-muted-foreground text-sm">Limit {data.maxLoans} výpožičiek je plný.</p>
				<Button type="button" disabled>Vypožičať</Button>
			{:else}
				<p class="text-muted-foreground text-sm">
					7–90 dní · {loanedLabel(data.activeCount)} u teba
				</p>
				<Button type="button" onclick={() => (slipOpen = true)}>Vypožičať</Button>
				<BorrowSlip
					title={book.title}
					defaults={borrower}
					errors={formErrors ?? {}}
					message={form && 'errors' in form ? form.message : ''}
					bind:open={slipOpen}
				/>
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
