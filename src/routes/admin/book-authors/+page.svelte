<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
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

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>Nová väzba</h2>
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Kniha</span>
				<select name="bookId" required>
					{#each data.books as item (item.id)}
						<option value={item.id}>{item.title}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field is-wide">
				<span>Autor</span>
				<select name="authorId" required>
					{#each data.authors as person (person.id)}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Poradie</span>
				<input name="position" type="number" min="0" value="0" />
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">Založiť</Button>
		</div>
	</form>
</div>
