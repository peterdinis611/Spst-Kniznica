<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Separator } from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Separator',
		component: Separator,
		tags: ['autodocs']
	});
</script>

<Story name="Vodorovný" asChild>
	<div class="w-72">
		<p class="font-display text-lg">Katalóg</p>
		<Separator class="my-3" />
		<p class="text-muted-foreground text-sm">20 zväzkov vo fonde</p>
	</div>
</Story>
