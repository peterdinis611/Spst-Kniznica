<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import { dueStatus, readerNumber, shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const freeSlots = $derived(data.maxLoans - data.activeCount);
</script>

<svelte:head>
	<title>Moje knihy · SPŠT Knižnica</title>
</svelte:head>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">{data.reader.name} · preukaz {readerNumber(data.reader.id)}</p>
	<div class="mt-2 flex flex-wrap items-end justify-between gap-4">
		<h1 class="display text-5xl md:text-7xl">Moje knihy</h1>
		<p class="text-sm text-mute">{data.activeCount} z {data.maxLoans} miest obsadených</p>
	</div>

	<div class="mt-5 h-2 overflow-hidden rounded-full bg-lift">
		<div
			class="h-full rounded-full bg-brass"
			style="width: {(data.activeCount / data.maxLoans) * 100}%"
		></div>
	</div>
	<p class="kicker mt-2">
		{freeSlots === 0 ? 'Limit naplnený' : `Ešte ${freeSlots} ${freeSlots === 1 ? 'miesto' : 'miesta'}`}
	</p>

	{#if form && 'message' in form && form.message}
		<p class="mt-4 text-ember">{form.message}</p>
	{/if}

	{#if data.loans.length === 0}
		<div class="panel mt-10 p-8">
			<p class="font-display text-3xl uppercase">Zatiaľ nič nepožičiavaš</p>
			<p class="mt-2 max-w-md text-mute">
				Vyber knihu v katalógu. Zelená bodka znamená, že je voľná.
			</p>
			<a href={resolve('/knihy')} class="btn mt-6">Otvoriť katalóg</a>
		</div>
	{:else}
		<ul class="mt-8 space-y-3">
			{#each data.loans as item, i (item.id)}
				{@const due = dueStatus(item.dueAt)}
				<li class="panel reveal flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" style="--i: {i}">
					<div class="min-w-0">
						<span class="badge {due.tone}">{due.label}</span>
						<a
							href={resolve('/knihy/[id]', { id: item.book.id })}
							class="font-display mt-3 block text-3xl uppercase no-underline hover:text-brass"
						>
							{item.book.title}
						</a>
						<p class="mt-1 text-sm text-mute">
							Vzaté {shortDate(item.borrowedAt)} · {item.book.callNumber}
						</p>
					</div>
					<form method="POST" action="?/return" use:enhance>
						<input type="hidden" name="loanId" value={item.id} />
						<button class="btn btn-ember" type="submit">Vrátiť</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.history.length}
		<section class="mt-14">
			<p class="kicker">História</p>
			<h2 class="font-display text-3xl uppercase">Vrátené</h2>
			<ol class="mt-4 divide-y divide-line border-y border-line">
				{#each data.history as item (item.id)}
					<li class="flex flex-wrap items-baseline justify-between gap-3 py-4">
						<a
							href={resolve('/knihy/[id]', { id: item.book.id })}
							class="text-linen no-underline hover:text-brass"
						>
							{item.book.title}
						</a>
						<span class="text-sm text-mute">
							{item.returnedAt ? shortDate(item.returnedAt) : ''}
						</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}
</section>
