<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { RESERVATION_STATUSES, reservationLabel, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { shortDate } from '$lib/format';
	import { pultHref, type PultColumn } from '$lib/pult-ledger';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{
			id: 'readerName',
			accessorKey: 'readerName',
			header: 'Čitateľ',
			cell: (info) => ({
				title: info.row.original.readerName,
				hint: info.row.original.readerEmail
			})
		},
		{ id: 'bookTitle', accessorKey: 'bookTitle', header: 'Kniha' },
		{
			id: 'status',
			accessorKey: 'status',
			header: 'Stav',
			cell: (info) => ({
				title: reservationLabel(info.row.original.status),
				hint: `do ${shortDate(info.row.original.expiresAt)}`
			})
		}
	];
</script>

<Seo title="Rezervácie · Pult" description="CRUD rezervácií školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha, čitateľ, stav" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="Žiadna rezervácia. Založ lístok vpravo.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať rezerváciu?" />
		{/snippet}
	</PultLedger>

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť rezerváciu' : 'Nová rezervácia'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Kniha</span>
				<select name="bookId" required>
					{#each data.books as item (item.id)}
						<option value={item.id} selected={current?.bookId === item.id}>{item.title}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field is-wide">
				<span>Čitateľ</span>
				<select name="userId" required>
					{#each data.readers as person (person.id)}
						<option value={person.id} selected={current?.userId === person.id}>
							{person.name} · {person.email}
						</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Stav</span>
				<select name="status">
					{#each RESERVATION_STATUSES as item (item.value)}
						<option value={item.value} selected={current?.status === item.value}>{item.label}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Vytvorená</span>
				<input name="createdAt" type="datetime-local" value={toDatetimeLocal(current?.createdAt)} />
			</label>
			<label class="pult-field is-wide">
				<span>Platí do</span>
				<input name="expiresAt" type="datetime-local" value={toDatetimeLocal(current?.expiresAt)} />
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/rezervacie" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
