<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CoverRail from './CoverRail.svelte';
	import { catalogBooks } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/CoverRail',
		component: CoverRail,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Police" args={{ books: catalogBooks }} />

<Story name="Krátka" args={{ books: catalogBooks.slice(0, 2) }} />
