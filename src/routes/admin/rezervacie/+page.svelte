<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIST_LIMIT, RESERVATION_STATUSES, reservationLabel, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
</script>

<Seo title="Rezervácie · Pult" description="CRUD rezervácií školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha, čitateľ, stav" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">Žiadna rezervácia. Založ lístok vpravo.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Čitateľ</th>
						<th>Kniha</th>
						<th>Stav</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.readerName}</strong>
								<em>{row.readerEmail}</em>
							</td>
							<td>{row.bookTitle}</td>
							<td>
								{reservationLabel(row.status)}
								<em>do {shortDate(row.expiresAt)}</em>
							</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/rezervacie?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									<PultDelete fields={{ id: row.id }} ask="Zmazať rezerváciu?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť rezerváciu' : 'Nová rezervácia'}</h2>
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
			<label class="pult-field is-wide">
				<span>Čitateľ</span>
				<select name="userId" required>
					{#each data.readers as person (person.id)}
						<option value={person.id} selected={current?.userId === person.id}>
							{person.name} · {person.email}
						</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Stav</span>
				<select name="status">
					{#each RESERVATION_STATUSES as item (item.value)}
						<option value={item.value} selected={current?.status === item.value}>{item.label}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Vytvorená</span>
				<input name="createdAt" type="datetime-local" value={toDatetimeLocal(current?.createdAt)} />
			</label>
			<label class="pult-field is-wide">
				<span>Platí do</span>
				<input name="expiresAt" type="datetime-local" value={toDatetimeLocal(current?.expiresAt)} />
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/rezervacie" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
