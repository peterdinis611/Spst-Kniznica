<script lang="ts">
	import { resolve } from '$app/paths';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const activeName = $derived(data.categories.find((cat) => cat.slug === data.odbor)?.name);
</script>

<Seo
	title="Katalóg"
	description="Prehľadaj školský fond SPŠT podľa názvu, autora, signatúry alebo odboru. Voľné výtlačky uvidíš hneď."
/>

<p class="text-muted-foreground text-sm">
	{data.books.length} kníh
	{#if data.q}pre „{data.q}“{/if}
	{#if activeName}· {activeName}{/if}
</p>

<div class="mt-4 flex flex-wrap gap-2">
	<Badge href={resolve('/books')} variant={!data.odbor ? 'default' : 'outline'} class="h-8">
		Všetko
	</Badge>
	{#each data.categories as cat (cat.id)}
		<Badge
			href="{resolve('/books')}?odbor={cat.slug}{data.q ? `&q=${encodeURIComponent(data.q)}` : ''}"
			variant={data.odbor === cat.slug ? 'default' : 'outline'}
			class="h-8"
		>
			{cat.name}
		</Badge>
	{/each}
</div>

{#if data.books.length === 0}
	<Alert.Root class="mt-10">
		<Alert.Title>Nič sa nenašlo</Alert.Title>
		<Alert.Description>Skús iné slovo, alebo zruš filter.</Alert.Description>
		<Alert.Action>
			<Button href={resolve('/books')} variant="outline" size="sm">Zrušiť filter</Button>
		</Alert.Action>
	</Alert.Root>
{:else}
	<div class="cover-grid mt-8">
		{#each data.books as book (book.id)}
			<LockerCard {book} />
		{/each}
	</div>
{/if}
