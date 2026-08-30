<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultCover from '$lib/components/PultCover.svelte';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { bookSchema } from '$lib/desk-fields';
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
		<PultSaveForm
			schema={bookSchema}
			defaults={{
				title: current?.title ?? '',
				subtitle: current?.subtitle ?? '',
				year: current?.year ?? 2020,
				pages: current?.pages ?? 200,
				isbn: current?.isbn ?? '',
				callNumber: current?.callNumber ?? '',
				categoryId: current?.categoryId ?? data.categories[0]?.id ?? '',
				publisher: current?.publisher ?? '',
				language: current?.language ?? 'sk',
				description: current?.description ?? '',
				copies: 1,
				featured: Boolean(current?.featured)
			}}
		>
			{#snippet children({ form: slip })}
				<h2>{current ? 'Opraviť zväzok' : 'Nový zväzok'}</h2>
				<input type="hidden" name="id" value={current?.id ?? ''} />
				<div class="pult-field is-wide">
					<span>Obálka</span>
					<PultCover url={current?.coverUrl} fileKey={current?.coverKey} ready={data.uploadReady} />
				</div>
				<div class="pult-fields is-2">
					<PultField form={slip} name="title" label="Názov" wide />
					<PultField form={slip} name="subtitle" label="Podtitul" wide />
					<PultField form={slip} name="year" label="Rok" type="number" numeric />
					<PultField form={slip} name="pages" label="Strany" type="number" numeric />
					<PultField form={slip} name="isbn" label="ISBN" />
					<PultField form={slip} name="callNumber" label="Signatúra" />
					<PultField form={slip} name="categoryId" label="Odbor" as="select">
						{#snippet options()}
							{#each data.categories as cat (cat.id)}
								<option value={cat.id}>{cat.code} · {cat.name}</option>
							{/each}
						{/snippet}
					</PultField>
					<PultField form={slip} name="publisher" label="Vydavateľ" />
					<PultField form={slip} name="language" label="Jazyk" />
					{#if !current}
						<PultField form={slip} name="copies" label="Výtlačky" type="number" numeric min={0} max={40} />
					{/if}
					<PultField form={slip} name="description" label="Anotácia" as="textarea" wide />
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
					<slip.Field name="featured">
						{#snippet children(field: any)}
							<label class="pult-field">
								<span>Na pulte</span>
								<div class="pult-checks">
									<label>
										<input
											type="checkbox"
											name="featured"
											value="1"
											checked={Boolean(field.state.value)}
											onchange={(event) => field.handleChange(event.currentTarget.checked)}
										/>
										odporúčaný zväzok
									</label>
								</div>
							</label>
						{/snippet}
					</slip.Field>
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
