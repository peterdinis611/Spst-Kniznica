<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIST_LIMIT } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const current = $derived(data.current);
</script>

<Seo title="Odbory · Pult" description="CRUD odborov školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="názov, slug, kód" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">V tejto zásuvke nie je odbor. Založ lístok vpravo.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Odbor</th>
						<th>Kód</th>
						<th>Knihy</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.name}</strong>
								<em>{row.slug}</em>
							</td>
							<td>{row.code}</td>
							<td>{row.bookCount}</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/odbory?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									<PultDelete fields={{ id: row.id }} ask="Zmazať odbor {row.name}?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť odbor' : 'Nový odbor'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field">
				<span>Názov</span>
				<input name="name" required value={current?.name ?? ''} />
			</label>
			<label class="pult-field">
				<span>Slug</span>
				<input name="slug" value={current?.slug ?? ''} placeholder="z názvu" />
			</label>
			<label class="pult-field">
				<span>Kód</span>
				<input name="code" required maxlength="8" value={current?.code ?? ''} />
			</label>
			<label class="pult-field">
				<span>Poradie</span>
				<input name="sortOrder" type="number" value={current?.sortOrder ?? 0} />
			</label>
			<label class="pult-field">
				<span>Farba</span>
				<input name="accent" type="color" value={current?.accent ?? '#3c2a21'} />
			</label>
			<label class="pult-field is-wide">
				<span>Popis</span>
				<textarea name="description" required>{current?.description ?? ''}</textarea>
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/odbory" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
