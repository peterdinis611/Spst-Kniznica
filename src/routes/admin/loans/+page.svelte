<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { deskClassFilterSchema, deskLoanSchema } from '$lib/desk-fields';
	import { firstSchemaIssue, applyToast } from '$lib/form-kit';
	import { shortDate } from '$lib/format';
	import { pultHref, type PultColumn } from '$lib/pult-ledger';
	import { toast } from 'svelte-sonner';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
	const manage = $derived(data.manage);
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{
			id: 'reader',
			accessorFn: (row) => `${row.borrowerLastName} ${row.borrowerFirstName}`,
			header: 'Lístok',
			cell: (info) => ({
				title: `${info.row.original.borrowerFirstName} ${info.row.original.borrowerLastName}`,
				hint: `${info.row.original.borrowerClass} · ${info.row.original.readerName}`
			})
		},
		{ id: 'bookTitle', accessorKey: 'bookTitle', header: 'Zväzok' },
		{
			id: 'dueAt',
			accessorFn: (row) => new Date(row.dueAt).getTime(),
			header: 'Termín',
			cell: (info) => ({
				title: shortDate(info.row.original.dueAt),
				hint: info.row.original.returnedAt ? 'vrátené' : 'vonku'
			})
		}
	];

	function checkClass(event: SubmitEvent) {
		const box = event.currentTarget as HTMLFormElement;
		const className = String(new FormData(box).get('class') ?? '');
		const issue = firstSchemaIssue(deskClassFilterSchema, { className });
		if (issue) {
			event.preventDefault();
			toast.error(issue);
		}
	}
</script>

<Seo title="Výpožičky · Pult" description="CRUD výpožičných lístkov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha, čitateľ, trieda" />
	<form class="pult-class" method="GET" novalidate onsubmit={checkClass}>
		{#if data.q}
			<input type="hidden" name="q" value={data.q} />
		{/if}
		<input type="hidden" name="open" value="1" />
		<label>
			<span>Trieda</span>
			<input
				name="class"
				type="text"
				list="desk-classes"
				value={data.klass}
				placeholder="II.A"
				autocomplete="off"
				aria-label="Trieda"
			/>
			<datalist id="desk-classes">
				{#each data.classes as item (item)}
					<option value={item}></option>
				{/each}
			</datalist>
		</label>
		<button type="submit">Čo je vonku</button>
		{#if data.klass && manage}
			<a href={pultHref(page.url, { class: data.klass, open: null })}>aj vrátené</a>
		{/if}
		{#if data.klass || data.open}
			<a href={pultHref(page.url, { class: null, open: null })}>zrušiť</a>
		{/if}
	</form>
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
		empty={data.klass
			? data.open
				? `V triede ${data.klass} nie je nič vonku.`
				: `V triede ${data.klass} nie je lístok.`
			: !manage
				? 'Zadaj triedu — II.A vonku.'
				: data.open
					? 'Nič nie je vonku.'
					: 'Žiadny výpožičný lístok.'}
	>
		{#snippet actions({ row })}
			{#if manage}
				<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
				{#if !row.returnedAt}
					<form method="POST" action="?/return" use:enhance={applyToast()}>
						<input type="hidden" name="id" value={row.id} />
						<Button size="sm" type="submit">Vrátiť</Button>
					</form>
				{/if}
				<PultDelete fields={{ id: row.id }} ask="Zmazať výpožičku {row.bookTitle}?" />
			{/if}
		{/snippet}
	</PultLedger>

	{#if manage}
	{#key current?.id ?? 'new'}
		<PultSaveForm
			schema={deskLoanSchema}
			defaults={{
				bookId: current?.bookId ?? data.books[0]?.id ?? '',
				userId: current?.userId ?? data.readers[0]?.id ?? '',
				borrowerFirstName: current?.borrowerFirstName ?? '',
				borrowerLastName: current?.borrowerLastName ?? '',
				borrowerClass: current?.borrowerClass ?? '',
				loanDays: current?.loanDays ?? 21,
				borrowedAt: toDatetimeLocal(current?.borrowedAt),
				dueAt: toDatetimeLocal(current?.dueAt),
				returnedAt: toDatetimeLocal(current?.returnedAt),
				renewalCount: current?.renewalCount ?? 0
			}}
		>
			{#snippet children({ form: slip })}
				<h2>{current ? 'Opraviť lístok' : 'Nový lístok'}</h2>
				<input type="hidden" name="id" value={current?.id ?? ''} />
				<div class="pult-fields is-2">
					<PultField form={slip} name="bookId" label="Kniha" as="select" wide disabled={Boolean(current)}>
						{#snippet options()}
							{#each data.books as item (item.id)}
								<option value={item.id}>{item.title}</option>
							{/each}
						{/snippet}
					</PultField>
					{#if current}
						<input type="hidden" name="bookId" value={current.bookId} />
					{/if}
					<PultField form={slip} name="userId" label="Čitateľ" as="select" wide disabled={Boolean(current)}>
						{#snippet options()}
							{#each data.readers as person (person.id)}
								<option value={person.id}>{person.name} · {person.email}</option>
							{/each}
						{/snippet}
					</PultField>
					{#if current}
						<input type="hidden" name="userId" value={current.userId} />
					{/if}
					<PultField form={slip} name="borrowerFirstName" label="Meno" />
					<PultField form={slip} name="borrowerLastName" label="Priezvisko" />
					<PultField form={slip} name="borrowerClass" label="Trieda" />
					<PultField form={slip} name="loanDays" label="Dni" type="number" numeric min={1} max={90} />
					<PultField form={slip} name="borrowedAt" label="Požičané" type="datetime-local" />
					<PultField form={slip} name="dueAt" label="Termín" type="datetime-local" />
					{#if current}
						<PultField form={slip} name="returnedAt" label="Vrátené" type="datetime-local" />
						<PultField form={slip} name="renewalCount" label="Predĺženia" type="number" numeric min={0} />
					{/if}
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
	{/if}
</div>
