<script lang="ts">
	import { resolve } from '$app/paths';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import LockerCard from '$lib/components/LockerCard.svelte';
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
			<Breadcrumb.Link href={resolve('/odbory')}>Odbory</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Page>{data.category.name}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<Badge class="mt-5" variant="outline">{data.category.code}</Badge>
<h2 class="mt-2 font-serif text-4xl font-bold md:text-5xl">{data.category.name}</h2>
<p class="text-muted-foreground mt-3 max-w-xl font-serif">{data.category.description}</p>

<div class="mt-8">
	<CoverRail books={data.books} />
</div>

<div class="cover-grid mt-8">
	{#each data.books as book (book.id)}
		<LockerCard {book} />
	{/each}
</div>
