<script lang="ts">
	import { page } from '$app/state';
	import { RESERVATION_STATUSES, reservationLabel, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { reservationSchema } from '$lib/desk-fields';
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

	{#key current?.id ?? 'new'}
		<PultSaveForm
			schema={reservationSchema}
			defaults={{
				bookId: current?.bookId ?? data.books[0]?.id ?? '',
				userId: current?.userId ?? data.readers[0]?.id ?? '',
				status: current?.status ?? 'pending',
				createdAt: toDatetimeLocal(current?.createdAt),
				expiresAt: toDatetimeLocal(current?.expiresAt)
			}}
		>
			{#snippet children({ form: slip })}
				<h2>{current ? 'Opraviť rezerváciu' : 'Nová rezervácia'}</h2>
				<input type="hidden" name="id" value={current?.id ?? ''} />
				<div class="pult-fields is-2">
					<PultField form={slip} name="bookId" label="Kniha" as="select" wide>
						{#snippet options()}
							{#each data.books as item (item.id)}
								<option value={item.id}>{item.title}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="userId" label="Čitateľ" as="select" wide>
						{#snippet options()}
							{#each data.readers as person (person.id)}
								<option value={person.id}>{person.name} · {person.email}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="status" label="Stav" as="select">
						{#snippet options()}
							{#each RESERVATION_STATUSES as item (item.value)}
								<option value={item.value}>{item.label}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="createdAt" label="Vytvorená" type="datetime-local" />
					<PultField form={slip} name="expiresAt" label="Platí do" type="datetime-local" wide />
				</div>
				<div class="pult-submit">
					<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
					{#if current}
						<Button href={pultHref(page.url, { edit: null })} variant="ghost">Zrušiť</Button>
					{/if}
				</div>
			{/snippet}
		</PultSaveForm>
	{/key}
</div>
