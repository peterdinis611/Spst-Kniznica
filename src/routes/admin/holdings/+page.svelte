<script lang="ts">
	import { page } from '$app/state';
	import { HOLDING_STATUSES, holdingLabel, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { holdingSchema } from '$lib/desk-fields';
	import { shortDate } from '$lib/format';
	import { pultHref, type PultColumn } from '$lib/pult-ledger';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{
			id: 'inventoryNo',
			accessorKey: 'inventoryNo',
			header: 'Inventár',
			cell: (info) => ({
				title: info.row.original.inventoryNo,
				hint: shortDate(info.row.original.acquiredAt)
			})
		},
		{ id: 'bookTitle', accessorKey: 'bookTitle', header: 'Kniha' },
		{
			id: 'status',
			accessorKey: 'status',
			header: 'Stav',
			cell: (info) => holdingLabel(info.row.original.status)
		}
	];
</script>

<Seo title="Výtlačky · Pult" description="CRUD inventárnych výtlačkov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="inventár, kniha, stav" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="V zásuvke nie je výtlačok.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať výtlačok {row.inventoryNo}?" />
		{/snippet}
	</PultLedger>

	{#key current?.id ?? 'new'}
		<PultSaveForm
			schema={holdingSchema}
			defaults={{
				bookId: current?.bookId ?? data.books[0]?.id ?? '',
				inventoryNo: current?.inventoryNo ?? '',
				status: current?.status ?? 'available',
				acquiredAt: toDatetimeLocal(current?.acquiredAt)
			}}
		>
			{#snippet children({ form: slip })}
				<h2>{current ? 'Opraviť výtlačok' : 'Nový výtlačok'}</h2>
				<input type="hidden" name="id" value={current?.id ?? ''} />
				<div class="pult-fields is-2">
					<PultField form={slip} name="bookId" label="Kniha" as="select" wide>
						{#snippet options()}
							{#each data.books as item (item.id)}
								<option value={item.id}>{item.title}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="inventoryNo" label="Inventár" placeholder="doplní sa samo" />
					<PultField form={slip} name="status" label="Stav" as="select">
						{#snippet options()}
							{#each HOLDING_STATUSES as item (item.value)}
								<option value={item.value}>{item.label}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="acquiredAt" label="Zaradený" type="datetime-local" wide />
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
