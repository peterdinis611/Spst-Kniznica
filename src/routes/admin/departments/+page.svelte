<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { pultHref, type PultColumn } from '$lib/pult-ledger';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{
			id: 'name',
			accessorKey: 'name',
			header: 'Odbor',
			cell: (info) => ({ title: info.row.original.name, hint: info.row.original.slug })
		},
		{ id: 'code', accessorKey: 'code', header: 'Kód' },
		{ id: 'bookCount', accessorKey: 'bookCount', header: 'Knihy' }
	];
</script>

<Seo title="Odbory · Pult" description="CRUD odborov školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="názov, slug, kód" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="V tejto zásuvke nie je odbor. Založ lístok vpravo.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať odbor {row.name}?" />
		{/snippet}
	</PultLedger>

	{#key current?.id ?? 'new'}
	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť odbor' : 'Nový odbor'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field">
				<span>Názov</span>
				<input name="name" required value={current?.name ?? ''} />
			</label>
			<label class="pult-field">
				<span>Slug</span>
				<input name="slug" value={current?.slug ?? ''} placeholder="z názvu" />
			</label>
			<label class="pult-field">
				<span>Kód</span>
				<input name="code" required maxlength="8" value={current?.code ?? ''} />
			</label>
			<label class="pult-field">
				<span>Poradie</span>
				<input name="sortOrder" type="number" value={current?.sortOrder ?? 0} />
			</label>
			<label class="pult-field">
				<span>Farba</span>
				<input name="accent" type="color" value={current?.accent ?? '#3c2a21'} />
			</label>
			<label class="pult-field is-wide">
				<span>Popis</span>
				<textarea name="description" required>{current?.description ?? ''}</textarea>
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href={pultHref(page.url, { edit: null })} variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
	{/key}
</div>
