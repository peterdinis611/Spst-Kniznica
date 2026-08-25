<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BorrowSlip from './BorrowSlip.svelte';
	import { sampleBook, sampleBorrower } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/BorrowSlip',
		component: BorrowSlip,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Otvorený" asChild>
	<BorrowSlip title={sampleBook.title} defaults={sampleBorrower} open />
</Story>

<Story name="Chýba trieda" asChild>
	<BorrowSlip
		title={sampleBook.title}
		defaults={{ ...sampleBorrower, className: '' }}
		errors={{ className: 'Zadaj triedu.' }}
		message="Doplň výpožičný lístok."
		open
	/>
</Story>
