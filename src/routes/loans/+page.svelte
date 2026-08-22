<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import BookCover from '$lib/components/BookCover.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import { dueStatus, readerNumber, shortDate } from '$lib/format';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const progress = $derived((data.activeCount / data.maxLoans) * 100);
</script>

<Seo
	title="Moja knižnica"
	description="Aktívne výpožičky a vrátenia v školskej knižnici SPŠT."
	index={false}
/>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<p class="text-muted-foreground text-sm">
	{data.reader.name} · preukaz {readerNumber(data.reader.id)} · {data.activeCount} z {data.maxLoans} miest
</p>
<Progress class="mt-4 max-w-md" max={100} value={progress} />

{#if form && 'message' in form && form.message}
	<Alert.Root variant="destructive" class="mt-4">
		<Alert.Description>{form.message}</Alert.Description>
	</Alert.Root>
{/if}

<Tabs.Root value="aktivne" class="mt-8">
	<Tabs.List>
		<Tabs.Trigger value="aktivne">Požičané ({data.loans.length})</Tabs.Trigger>
		<Tabs.Trigger value="historia">Vrátené ({data.history.length})</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="aktivne" class="mt-6">
		{#if data.loans.length === 0}
			<Alert.Root>
				<Alert.Title>Zatiaľ nič nepožičiavaš</Alert.Title>
				<Alert.Description>Vyber knihu z katalógu a vypožičaj si ju na 21 dní.</Alert.Description>
				<Alert.Action>
					<Button href={resolve('/books')} size="sm">Otvoriť katalóg</Button>
				</Alert.Action>
			</Alert.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each data.loans as item (item.id)}
					{@const due = dueStatus(item.dueAt)}
					<Card.Root class="overflow-hidden py-0">
						<Card.Content class="flex gap-4 p-4">
							<BookCover book={item.book} size="thumb" />
							<div class="flex min-w-0 flex-1 flex-col justify-between">
								<div>
									<Badge variant={due.tone === 'ok' ? 'secondary' : 'destructive'}>{due.label}</Badge>
									<Card.Title class="mt-2 text-xl">
										<a href={resolve('/books/[id]', { id: item.book.id })} class="hover:text-primary">
											{item.book.title}
										</a>
									</Card.Title>
									<Card.Description>Od {shortDate(item.borrowedAt)}</Card.Description>
								</div>
								<form class="mt-4" method="POST" action="?/return" use:enhance>
									<input type="hidden" name="loanId" value={item.id} />
									<Button type="submit" variant="destructive" size="sm">Vrátiť</Button>
								</form>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</Tabs.Content>
	<Tabs.Content value="historia" class="mt-6">
		{#if data.history.length === 0}
			<p class="text-muted-foreground">Ešte žiadna vrátená kniha.</p>
		{:else}
			<ul class="divide-border divide-y">
				{#each data.history as item (item.id)}
					<li class="flex flex-wrap justify-between gap-2 py-3">
						<a class="hover:text-primary font-medium" href={resolve('/books/[id]', { id: item.book.id })}>
							{item.book.title}
						</a>
						<span class="text-muted-foreground text-sm">
							{item.returnedAt ? shortDate(item.returnedAt) : ''}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Tabs.Content>
</Tabs.Root>
