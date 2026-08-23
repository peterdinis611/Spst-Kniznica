<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Empty from './index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';

	const { Story } = defineMeta({
		title: 'UI/Empty',
		component: Empty.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Katalóg" asChild>
	<Empty.Root class="w-[28rem] border">
		<Empty.Header>
			<Empty.Media variant="icon">
				<BookOpenIcon />
			</Empty.Media>
			<Empty.Title class="font-display text-xl">V fonde nič nesedí</Empty.Title>
			<Empty.Description>Skús iný názov, autora alebo zruš filter odboru.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button size="sm" variant="outline">Zrušiť filter</Button>
		</Empty.Content>
	</Empty.Root>
</Story>

<Story name="Výpožičky" asChild>
	<Empty.Root class="w-[28rem] border">
		<Empty.Header>
			<Empty.Title class="font-display text-xl">Skrinka je prázdna</Empty.Title>
			<Empty.Description>Vyber knihu z katalógu a vypožičaj si ju na 21 dní.</Empty.Description>
		</Empty.Header>
	</Empty.Root>
</Story>
