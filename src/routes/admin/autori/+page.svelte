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
			header: 'Autor',
			cell: (info) => ({ title: info.row.original.name, hint: info.row.original.lifespan })
		},
		{ id: 'role', accessorKey: 'role', header: 'Rola' },
		{ id: 'bookCount', accessorKey: 'bookCount', header: 'Knihy' }
	];
</script>

<Seo title="Autori · Pult" description="CRUD autorov školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="meno, slug, rola" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="V zásuvke nie je autor.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať autora {row.name}?" />
		{/snippet}
	</PultLedger>

	{#key current?.id ?? 'new'}
	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť autora' : 'Nový autor'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field">
				<span>Meno</span>
				<input name="name" required value={current?.name ?? ''} />
			</label>
			<label class="pult-field">
				<span>Slug</span>
				<input name="slug" value={current?.slug ?? ''} placeholder="z mena" />
			</label>
			<label class="pult-field">
				<span>Rola</span>
				<input name="role" required value={current?.role ?? ''} />
			</label>
			<label class="pult-field">
				<span>Roky</span>
				<input name="lifespan" required value={current?.lifespan ?? ''} placeholder="1952 —" />
			</label>
			<label class="pult-field is-wide">
				<span>Medailón</span>
				<textarea name="bio" required>{current?.bio ?? ''}</textarea>
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
