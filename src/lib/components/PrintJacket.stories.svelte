<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PrintJacket from './PrintJacket.svelte';
	import { sampleBook } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/PrintJacket',
		component: PrintJacket,
		tags: ['autodocs'],
		args: {
			book: sampleBook,
			linked: false
		}
	});
</script>

<Story name="Shelf" args={{ size: 'shelf' }} />

<Story name="Feature" args={{ size: 'feature' }} />
