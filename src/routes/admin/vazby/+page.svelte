<script lang="ts">
	import { enhance } from '$app/forms';
	import { LIST_LIMIT } from '$lib/admin';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultDelete from '$lib/components/PultDelete.svelte';
	import PultSearch from '$lib/components/PultSearch.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<Seo title="Väzby · Pult" description="CRUD väzieb kniha–autor." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="kniha alebo autor" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">Žiadna väzba kniha–autor.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Kniha</th>
						<th>Autor</th>
						<th>Poradie</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (`${row.bookId}-${row.authorId}`)}
						<tr>
							<td><strong>{row.bookTitle}</strong></td>
							<td>{row.authorName}</td>
							<td>{row.position}</td>
							<td>
								<div class="pult-actions">
									<PultDelete
										fields={{ bookId: row.bookId, authorId: row.authorId }}
										ask="Zmazať väzbu {row.authorName} ↔ {row.bookTitle}?"
									/>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>Nová väzba</h2>
		<div class="pult-fields is-2">
			<label class="pult-field is-wide">
				<span>Kniha</span>
				<select name="bookId" required>
					{#each data.books as item (item.id)}
						<option value={item.id}>{item.title}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field is-wide">
				<span>Autor</span>
				<select name="authorId" required>
					{#each data.authors as person (person.id)}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</label>
			<label class="pult-field">
				<span>Poradie</span>
				<input name="position" type="number" min="0" value="0" />
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">Založiť</Button>
		</div>
	</form>
</div>
