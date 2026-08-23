<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Card from './index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	const { Story } = defineMeta({
		title: 'UI/Card',
		component: Card.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Výpožička" asChild>
	<Card.Root class="w-80">
		<Card.Header>
			<Card.Title class="font-display text-2xl">Algoritmy v dielni</Card.Title>
			<Card.Description>Vrátiť do 12. septembra · 21 dní</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">INF · Prof. Ján Belko · 2 voľné z 4</p>
		</Card.Content>
		<Card.Footer>
			<Button size="sm">Vrátiť</Button>
		</Card.Footer>
	</Card.Root>
</Story>

<Story name="Prázdna karta" asChild>
	<Card.Root class="w-80">
		<Card.Header>
			<Card.Title>Moje knihy</Card.Title>
			<Card.Description>Zatiaľ nič v skrinke.</Card.Description>
		</Card.Header>
	</Card.Root>
</Story>
