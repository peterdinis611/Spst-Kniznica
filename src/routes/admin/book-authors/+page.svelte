<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { linkSchema } from '$lib/desk-fields';
	import type { PultColumn } from '$lib/pult-ledger';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{ id: 'bookTitle', accessorKey: 'bookTitle', header: 'Kniha' },
		{ id: 'authorName', accessorKey: 'authorName', header: 'Autor' },
		{ id: 'position', accessorKey: 'position', header: 'Poradie' }
	];
</script>

<Seo title="Väzby · Pult" description="CRUD väzieb kniha–autor." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha alebo autor" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger
		rows={data.rows}
		{columns}
		empty="Žiadna väzba kniha–autor."
		getRowId={(row) => `${row.bookId}-${row.authorId}`}
	>
		{#snippet actions({ row })}
			<PultDelete
				fields={{ bookId: row.bookId, authorId: row.authorId }}
				ask="Zmazať väzbu {row.authorName} ↔ {row.bookTitle}?"
			/>
		{/snippet}
	</PultLedger>

	<PultSaveForm
		schema={linkSchema}
		defaults={{
			bookId: data.books[0]?.id ?? '',
			authorId: data.authors[0]?.id ?? '',
			position: 0
		}}
	>
		{#snippet children({ form: slip })}
			<h2>Nová väzba</h2>
			<div class="pult-fields is-2">
				<PultField form={slip} name="bookId" label="Kniha" as="select" wide>
					{#snippet options()}
						{#each data.books as item (item.id)}
							<option value={item.id}>{item.title}</option>
						{/each}
					{/snippet}
				</PultField>
				<PultField form={slip} name="authorId" label="Autor" as="select" wide>
					{#snippet options()}
						{#each data.authors as person (person.id)}
							<option value={person.id}>{person.name}</option>
						{/each}
					{/snippet}
				</PultField>
				<PultField form={slip} name="position" label="Poradie" type="number" numeric min={0} />
			</div>
			<div class="pult-submit">
				<Button type="submit">Založiť</Button>
			</div>
		{/snippet}
	</PultSaveForm>
</div>
