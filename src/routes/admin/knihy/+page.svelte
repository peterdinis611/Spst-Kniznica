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
			id: 'title',
			accessorKey: 'title',
			header: 'Zväzok',
			cell: (info) => ({
				title: info.row.original.title,
				hint: `${info.row.original.callNumber} · ${info.row.original.isbn}`
			})
		},
		{ id: 'categoryName', accessorKey: 'categoryName', header: 'Odbor' },
		{
			id: 'copies',
			accessorFn: (row) => row.copiesAvailable,
			header: 'Výtlačky',
			cell: (info) => `${info.row.original.copiesAvailable}/${info.row.original.copiesTotal}`
		}
	];
</script>

<Seo title="Knihy · Pult" description="CRUD kníh školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="názov, ISBN, signatúra" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="V zásuvke nie je kniha. Upresni hľadanie, alebo založ zväzok.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať knihu {row.title}?" />
		{/snippet}
	</PultLedger>

	{#key current?.id ?? 'new'}
	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť zväzok' : 'Nový zväzok'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Názov</span>
				<input name="title" required value={current?.title ?? ''} />
			</label>
			<label class="pult-field is-wide">
				<span>Podtitul</span>
				<input name="subtitle" value={current?.subtitle ?? ''} />
			</label>
			<label class="pult-field">
				<span>Rok</span>
				<input name="year" type="number" required value={current?.year ?? 2020} />
			</label>
			<label class="pult-field">
				<span>Strany</span>
				<input name="pages" type="number" required value={current?.pages ?? 200} />
			</label>
			<label class="pult-field">
				<span>ISBN</span>
				<input name="isbn" required value={current?.isbn ?? ''} />
			</label>
			<label class="pult-field">
				<span>Signatúra</span>
				<input name="callNumber" required value={current?.callNumber ?? ''} />
			</label>
			<label class="pult-field">
				<span>Odbor</span>
				<select name="categoryId" required>
					{#each data.categories as cat (cat.id)}
						<option value={cat.id} selected={current?.categoryId === cat.id}>{cat.code} · {cat.name}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Vydavateľ</span>
				<input name="publisher" required value={current?.publisher ?? ''} />
			</label>
			<label class="pult-field">
				<span>Jazyk</span>
				<input name="language" value={current?.language ?? 'sk'} />
			</label>
			{#if !current}
				<label class="pult-field">
					<span>Výtlačky</span>
					<input name="copies" type="number" min="0" max="40" value="1" />
				</label>
			{/if}
			<label class="pult-field is-wide">
				<span>Anotácia</span>
				<textarea name="description" required>{current?.description ?? ''}</textarea>
			</label>
			<label class="pult-field is-wide">
				<span>Autori</span>
				<div class="pult-checks">
					{#each data.authors as person (person.id)}
						<label>
							<input
								type="checkbox"
								name="authorIds"
								value={person.id}
								checked={data.linkedIds.includes(person.id)}
							/>
							{person.name}
						</label>
					{/each}
				</div>
			</label>
			<label class="pult-field">
				<span>Na pulte</span>
				<div class="pult-checks">
					<label>
						<input type="checkbox" name="featured" value="1" checked={Boolean(current?.featured)} />
						odporúčaný zväzok
					</label>
				</div>
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
