<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FolioShelf from './FolioShelf.svelte';
	import { shelfBooks } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/FolioShelf',
		component: FolioShelf,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' },
		args: { books: shelfBooks }
	});
</script>

<Story name="Police" />

<Story name="Krátka" args={{ books: shelfBooks.slice(0, 3) }} />
