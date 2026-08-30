<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { authorSchema } from '$lib/desk-fields';
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
		<PultSaveForm
			schema={authorSchema}
			defaults={{
				name: current?.name ?? '',
				role: current?.role ?? '',
				lifespan: current?.lifespan ?? '',
				bio: current?.bio ?? ''
			}}
		>
			{#snippet children({ form: slip })}
				<h2>{current ? 'Opraviť autora' : 'Nový autor'}</h2>
				<input type="hidden" name="id" value={current?.id ?? ''} />
				<div class="pult-fields is-2">
					<PultField form={slip} name="name" label="Meno" />
					<label class="pult-field">
						<span>Slug</span>
						<input name="slug" value={current?.slug ?? ''} placeholder="z mena" />
					</label>
					<PultField form={slip} name="role" label="Rola" />
					<PultField form={slip} name="lifespan" label="Roky" placeholder="1952 —" />
					<PultField form={slip} name="bio" label="Medailón" as="textarea" wide />
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
