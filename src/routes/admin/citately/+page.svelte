<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIST_LIMIT } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { readerNumber, shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
</script>

<Seo title="Čitatelia · Pult" description="Úprava preukazov čitateľov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="meno alebo e-mail" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<p class="pult-lede" style="margin-bottom: 1rem">
	Nový preukaz vzniká registráciou. Tu opravíš meno a e-mail v miestnom fonde — heslo ostáva v Supabase.
</p>

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">Žiadny preukaz.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Čitateľ</th>
						<th>Preukaz</th>
						<th>Lístky</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.name}</strong>
								<em>{row.email}</em>
							</td>
							<td>{readerNumber(row.id)}</td>
							<td>{row.loanCount}</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/citately?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									<PultDelete fields={{ id: row.id }} ask="Zmazať preukaz {row.name}?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if current}
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
			</div>
			<p class="pult-count">založený {shortDate(current.createdAt)}</p>
			<div class="pult-submit">
				<Button type="submit">Uložiť</Button>
				<Button href="/admin/citately" variant="ghost">Zrušiť</Button>
			</div>
		</form>
	{/if}
</div>
