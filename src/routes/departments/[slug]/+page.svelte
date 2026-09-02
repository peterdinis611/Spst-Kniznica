<script lang="ts">
	import { resolve } from '$app/paths';
	import CatalogSlip from '$lib/components/CatalogSlip.svelte';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import VirtualWindow from '$lib/components/VirtualWindow.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';

	let { data }: PageProps = $props();
</script>

<Seo
	title={data.category.name}
	description={`Knihy odboru ${data.category.name} vo fonde školskej knižnice SPŠT.`}
/>

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/departments')}>Odbory</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item class="min-w-0">
			<Breadcrumb.Page class="block max-w-[16ch] truncate sm:max-w-[28ch]">{data.category.name}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<Badge class="mt-5" variant="outline">{data.category.code}</Badge>
<h2 class="mt-2 font-serif text-[clamp(1.85rem,8vw,3.1rem)] leading-[1.05] font-bold break-words">{data.category.name}</h2>
<p class="text-muted-foreground mt-3 max-w-xl font-serif">{data.category.description}</p>

<p class="text-muted-foreground mt-6 max-w-xl font-serif text-[0.95rem] dark:text-[#d2c6b4]">
	Otoč zväzok šípami alebo ťahaním. Vybraný sa vysunie.
</p>

<div class="mt-4">
	<CoverRail books={data.books.slice(0, 16)} />
</div>

<div class="mt-8">
	<VirtualWindow count={data.books.length} estimateSize={() => 88}>
		{#snippet children({ row })}
			{@const book = data.books[row.index]}
			{#if book}
				<CatalogSlip {book} />
			{/if}
		{/snippet}
	</VirtualWindow>
</div>
