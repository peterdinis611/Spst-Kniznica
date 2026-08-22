<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	const message = $derived(page.error?.message ?? 'Túto stránku sme nenašli.');
</script>

<svelte:head>
	<title>Chyba · SPŠT Knižnica</title>
</svelte:head>

<Card.Root class="max-w-lg">
	<Card.Header>
		<p class="text-muted-foreground text-sm">Chýbajúca strana</p>
		<Card.Title class="font-serif text-7xl">{page.status}</Card.Title>
	</Card.Header>
	<Card.Content>
		<Alert.Root>
			<Alert.Title>Kniha nie je na polici</Alert.Title>
			<Alert.Description>{message}</Alert.Description>
		</Alert.Root>
	</Card.Content>
	<Card.Footer>
		<Button href={resolve('/discover')}>Späť do katalógu</Button>
	</Card.Footer>
</Card.Root>
