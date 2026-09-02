<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultField from '$lib/components/PultField.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { readerSchema } from '$lib/desk-fields';
	import { readerNumber, shortDate } from '$lib/format';
	import { pultHref, type PultColumn } from '$lib/pult-ledger';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
	const columns: PultColumn<(typeof data.rows)[number]>[] = [
		{
			id: 'name',
			accessorKey: 'name',
			header: 'Čitateľ',
			cell: (info) => ({
				title: info.row.original.name,
				hint: [info.row.original.email, info.row.original.className].filter(Boolean).join(' · ')
			})
		},
		{
			id: 'pass',
			accessorFn: (row) => readerNumber(row.id),
			header: 'Preukaz',
			cell: (info) => readerNumber(info.row.original.id)
		},
		{
			id: 'role',
			accessorKey: 'role',
			header: 'Rola',
			cell: (info) => {
				const role = parseRole(info.row.original.role);
				return { stamp: ROLE_LABELS[role], desk: role !== 'reader' };
			}
		},
		{ id: 'loanCount', accessorKey: 'loanCount', header: 'Lístky' }
	];
</script>

<Seo title="Čitatelia · Pult" description="Úprava preukazov čitateľov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="meno alebo e-mail" />
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<p class="pult-lede" style="margin-bottom: 1rem">
	Nový preukaz vzniká registráciou. Tu opravíš meno, e-mail, rolu a triedu učiteľa — heslo ostáva
	v Supabase. Pult otvorí pečiatka <strong>knihovník</strong> (celý fond) alebo
	<strong>učiteľ</strong> (trieda vonku, bez mazania).
</p>

<form
	class="pult-year"
	method="POST"
	action="?/rollYear"
	onsubmit={(event) => {
		if (!confirm('Posunúť ročníky? I.A → II.A, IV.A → absolvent. Učiteľov nechá.')) {
			event.preventDefault();
		}
	}}
>
	<p>
		September. Čitateľov s ročníkom <em>I–IV</em> posunieš o rok. Štvrtáci dostanú pečiatku
		absolvent. Otvorené lístky idú s nimi. Triednych učiteľov necháva — opravíš triedu na preukaze.
	</p>
	<Button type="submit" variant="outline">Posunúť ročníky</Button>
</form>

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="Žiadny preukaz.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať preukaz {row.name}?" />
		{/snippet}
	</PultLedger>

	{#if current}
		{#key current.id}
			<PultSaveForm
				schema={readerSchema}
				defaults={{
					name: current.name,
					email: current.email,
					role: parseRole(current.role),
					className: current.className ?? ''
				}}
			>
				{#snippet children({ form: slip })}
					<h2>Opraviť preukaz</h2>
					<input type="hidden" name="id" value={current.id} />
					<div class="pult-fields is-2">
						<PultField form={slip} name="name" label="Meno" />
						<PultField form={slip} name="email" label="E-mail" type="email" />
						<PultField form={slip} name="role" label="Rola" as="select">
							{#snippet options()}
								{#each DESK_ROLES as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							{/snippet}
						</PultField>
						<PultField form={slip} name="className" label="Trieda" placeholder="II.A" />
					</div>
					<p class="pult-count">
						založený {shortDate(current.createdAt)}. Trieda na preukaze učiteľa otvorí pult a týždenný
						list.
					</p>
					<div class="pult-submit">
						<Button type="submit">Uložiť</Button>
						<Button href={pultHref(page.url, { edit: null })} variant="ghost">Zrušiť</Button>
					</div>
				{/snippet}
			</PultSaveForm>
		{/key}
	{/if}
</div>
