<script lang="ts">
	import { resolve } from '$app/paths';
	import LockerCard from '$lib/components/LockerCard.svelte';
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
			<Breadcrumb.Link href={resolve('/autori')}>Autori</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			<Breadcrumb.Page>{data.author.name}</Breadcrumb.Page>
		</Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<Badge class="mt-5" variant="outline">{data.author.role}</Badge>
<h2 class="mt-2 font-serif text-4xl font-bold md:text-5xl">{data.author.name}</h2>
<p class="text-muted-foreground mt-3 max-w-xl font-serif text-lg">{data.author.bio}</p>
<div class="cover-grid mt-10">
	{#each data.books as book (book.id)}
		<LockerCard {book} />
	{/each}
</div>
