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

<Seo title="Autori · Pult" description="CRUD autorov školského fondu." index={false} />

<div class="pult-toolbar">
	<PultSearch query={data.q} placeholder="meno, slug, rola" />
	<p class="pult-count">{data.rows.length}{data.rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke</p>
</div>

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

<div class="pult-grid is-split">
	{#if data.rows.length === 0}
		<p class="pult-empty">V zásuvke nie je autor.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="pult-table">
				<thead>
					<tr>
						<th>Autor</th>
						<th>Rola</th>
						<th>Knihy</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr>
							<td>
								<strong>{row.name}</strong>
								<em>{row.lifespan}</em>
							</td>
							<td>{row.role}</td>
							<td>{row.bookCount}</td>
							<td>
								<div class="pult-actions">
									<Button href="/admin/autori?edit={row.id}" size="sm" variant="outline">Upraviť</Button>
									<PultDelete fields={{ id: row.id }} ask="Zmazať autora {row.name}?" />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<form class="pult-form" method="POST" action="?/save" use:enhance>
		<h2>{current ? 'Opraviť autora' : 'Nový autor'}</h2>
		<input type="hidden" name="id" value={current?.id ?? ''} />
		<div class="pult-fields is-2">
			<label class="pult-field">
				<span>Meno</span>
				<input name="name" required value={current?.name ?? ''} />
			</label>
			<label class="pult-field">
				<span>Slug</span>
				<input name="slug" value={current?.slug ?? ''} placeholder="z mena" />
			</label>
			<label class="pult-field">
				<span>Rola</span>
				<input name="role" required value={current?.role ?? ''} />
			</label>
			<label class="pult-field">
				<span>Roky</span>
				<input name="lifespan" required value={current?.lifespan ?? ''} placeholder="1952 —" />
			</label>
			<label class="pult-field is-wide">
				<span>Medailón</span>
				<textarea name="bio" required>{current?.bio ?? ''}</textarea>
			</label>
		</div>
		<div class="pult-submit">
			<Button type="submit">{current ? 'Uložiť' : 'Založiť'}</Button>
			{#if current}
				<Button href="/admin/autori" variant="ghost">Zrušiť</Button>
			{/if}
		</div>
	</form>
</div>
