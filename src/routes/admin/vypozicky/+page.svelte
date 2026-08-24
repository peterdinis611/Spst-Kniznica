<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIST_LIMIT, toDatetimeLocal } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
</script>

<Seo title="Výpožičky · Pult" description="CRUD výpožičných lístkov." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha, čitateľ, trieda" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">Žiadny výpožičný lístok.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Lístok</th>
						<th>Zväzok</th>
						<th>Termín</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.borrowerFirstName} {row.borrowerLastName}</strong>
								<em>{row.borrowerClass} · {row.readerName}</em>
							</td>
							<td>{row.bookTitle}</td>
							<td>
								{shortDate(row.dueAt)}
								<em>{row.returnedAt ? 'vrátené' : 'vonku'}</em>
							</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/vypozicky?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									{#if !row.returnedAt}
										<form method="POST" action="?/return">
											<input type="hidden" name="id" value={row.id} />
											<Button size="sm" type="submit">Vrátiť</Button>
										</form>
									{/if}
									<PultDelete fields={{ id: row.id }} ask="Zmazať výpožičku {row.bookTitle}?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť lístok' : 'Nový lístok'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Kniha</span>
				<select name="bookId" required disabled={Boolean(current)}>
					{#each data.books as item (item.id)}
						<option value={item.id} selected={current?.bookId === item.id}>{item.title}</option>
					{/each}
				</select>
				{#if current}
					<input type="hidden" name="bookId" value={current.bookId} />
				{/if}
			</label>
			<label class="pult-field is-wide">
				<span>Čitateľ</span>
				<select name="userId" required disabled={Boolean(current)}>
					{#each data.readers as person (person.id)}
						<option value={person.id} selected={current?.userId === person.id}>
							{person.name} · {person.email}
						</option>
					{/each}
				</select>
				{#if current}
					<input type="hidden" name="userId" value={current.userId} />
				{/if}
			</label>
			<label class="pult-field">
				<span>Meno</span>
				<input name="borrowerFirstName" required value={current?.borrowerFirstName ?? ''} />
			</label>
			<label class="pult-field">
				<span>Priezvisko</span>
				<input name="borrowerLastName" required value={current?.borrowerLastName ?? ''} />
			</label>
			<label class="pult-field">
				<span>Trieda</span>
				<input name="borrowerClass" required value={current?.borrowerClass ?? ''} />
			</label>
			<label class="pult-field">
				<span>Dni</span>
				<input name="loanDays" type="number" min="1" max="90" value={current?.loanDays ?? 21} />
			</label>
			<label class="pult-field">
				<span>Požičané</span>
				<input name="borrowedAt" type="datetime-local" value={toDatetimeLocal(current?.borrowedAt)} />
			</label>
			<label class="pult-field">
				<span>Termín</span>
				<input name="dueAt" type="datetime-local" value={toDatetimeLocal(current?.dueAt)} />
			</label>
			{#if current}
				<label class="pult-field">
					<span>Vrátené</span>
					<input name="returnedAt" type="datetime-local" value={toDatetimeLocal(current.returnedAt)} />
				</label>
				<label class="pult-field">
					<span>Predĺženia</span>
					<input name="renewalCount" type="number" min="0" value={current.renewalCount} />
				</label>
			{/if}
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/vypozicky" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
