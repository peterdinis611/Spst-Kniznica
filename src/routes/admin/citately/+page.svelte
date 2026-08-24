<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { DESK_ROLES, ROLE_LABELS, parseRole } from '$lib/ability';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultLedger from '$lib/components/PultLedger.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
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
			cell: (info) => ({ title: info.row.original.name, hint: info.row.original.email })
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
				return { stamp: ROLE_LABELS[role], desk: role === 'librarian' };
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
	Nový preukaz vzniká registráciou. Tu opravíš meno, e-mail a rolu — heslo ostáva v Supabase. Pult
	otvorí len pečiatka <strong>knihovník</strong>.
</p>

<div class="pult-grid is-split">
	<PultLedger rows={data.rows} {columns} empty="Žiadny preukaz.">
		{#snippet actions({ row })}
			<Button href={pultHref(page.url, { edit: row.id })} size="sm" variant="outline">Upraviť</Button>
			<PultDelete fields={{ id: row.id }} ask="Zmazať preukaz {row.name}?" />
		{/snippet}
	</PultLedger>

	{#if current}
		{#key current.id}
		<form class="pult-form" method="POST" action="?/save" use:enhance>
			<h2>Opraviť preukaz</h2>
			<input type="hidden" name="id" value={current.id} />
			<div class="pult-fields is-2">
				<label class="pult-field">
					<span>Meno</span>
					<input name="name" required value={current.name} />
				</label>
				<label class="pult-field">
					<span>E-mail</span>
					<input name="email" type="email" required value={current.email} />
				</label>
				<label class="pult-field">
					<span>Rola</span>
					<select name="role">
						{#each DESK_ROLES as option (option.value)}
							<option value={option.value} selected={parseRole(current.role) === option.value}>
								{option.label}
							</option>
						{/each}
					</select>
				</label>
			</div>
			<p class="pult-count">založený {shortDate(current.createdAt)}</p>
			<div class="pult-submit">
				<Button type="submit">Uložiť</Button>
				<Button href={pultHref(page.url, { edit: null })} variant="ghost">Zrušiť</Button>
			</div>
		</form>
		{/key}
	{/if}
</div>
