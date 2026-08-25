<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FundLedger from './FundLedger.svelte';
	import { catalogBooks, categories } from '$lib/stories/fixtures';

	const chips = categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		code: category.code,
		accent: category.accent,
		bookCount: category.bookCount
	}));

	const { Story } = defineMeta({
		title: 'Fond/FundLedger',
		component: FundLedger,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Register" asChild>
	<div class="landing p-6">
		<FundLedger books={catalogBooks} categories={chips} />
	</div>
</Story>
