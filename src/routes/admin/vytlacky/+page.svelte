<script lang="ts">
	import { enhance } from '$app/forms';
	import { HOLDING_STATUSES, LIST_LIMIT, holdingLabel, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
</script>

<Seo title="Výtlačky · Pult" description="CRUD inventárnych výtlačkov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="inventár, kniha, stav" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">V zásuvke nie je výtlačok.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Inventár</th>
						<th>Kniha</th>
						<th>Stav</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.inventoryNo}</strong>
								<em>{shortDate(row.acquiredAt)}</em>
							</td>
							<td>{row.bookTitle}</td>
							<td>{holdingLabel(row.status)}</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/vytlacky?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									<PultDelete fields={{ id: row.id }} ask="Zmazať výtlačok {row.inventoryNo}?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť výtlačok' : 'Nový výtlačok'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Kniha</span>
				<select name="bookId" required>
					{#each data.books as item (item.id)}
						<option value={item.id} selected={current?.bookId === item.id}>{item.title}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Inventár</span>
				<input name="inventoryNo" value={current?.inventoryNo ?? ''} placeholder="doplní sa samo" />
			</label>
			<label class="pult-field">
				<span>Stav</span>
				<select name="status">
					{#each HOLDING_STATUSES as item (item.value)}
						<option value={item.value} selected={current?.status === item.value}>{item.label}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field is-wide">
				<span>Zaradený</span>
				<input name="acquiredAt" type="datetime-local" value={toDatetimeLocal(current?.acquiredAt)} />
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/vytlacky" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
