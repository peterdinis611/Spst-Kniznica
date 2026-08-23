<script lang="ts">
	import { resolve } from '$app/paths';
	import CatalogSlip from '$lib/components/CatalogSlip.svelte';
	import VirtualWindow from '$lib/components/VirtualWindow.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';

	let { data }: PageProps = $props();
</script>

<Seo title={data.author.name} description={data.author.bio} />

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/authors')}>Autori</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item class="min-w-0">
			<Breadcrumb.Page class="block max-w-[16ch] truncate sm:max-w-[28ch]">{data.author.name}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<Badge class="mt-5" variant="outline">{data.author.role}</Badge>
<h2 class="mt-2 font-serif text-[clamp(1.85rem,8vw,3.1rem)] leading-[1.05] font-bold break-words">{data.author.name}</h2>
<p class="text-muted-foreground mt-3 max-w-xl font-serif text-lg">{data.author.bio}</p>
<div class="mt-10">
	<VirtualWindow count={data.books.length} estimateSize={() => 88}>
		{#snippet children({ row })}
			{@const book = data.books[row.index]}
			{#if book}
				<CatalogSlip {book} />
			{/if}
		{/snippet}
	</VirtualWindow>
</div>
