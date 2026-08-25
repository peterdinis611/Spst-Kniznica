<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CatalogSearch from './CatalogSearch.svelte';
	import { searchPreview } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/CatalogSearch',
		component: CatalogSearch,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Náhľad" asChild>
	<div class="landing min-h-[28rem]">
		<CatalogSearch preview={searchPreview} open />
	</div>
</Story>
