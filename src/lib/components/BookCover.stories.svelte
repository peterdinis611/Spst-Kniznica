<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BookCover from './BookCover.svelte';
	import { catalogBooks, sampleBook } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/BookCover',
		component: BookCover,
		tags: ['autodocs'],
		args: { book: sampleBook, linked: false }
	});
</script>

<Story name="Rail" args={{ size: 'rail' }} />

<Story name="Hero" args={{ size: 'hero' }} />

<Story name="Tile" args={{ size: 'tile' }} />

<Story name="Thumb" args={{ size: 'thumb' }} />

<Story name="Veľkosti" asChild>
	<div class="flex flex-wrap items-end gap-6 p-4">
		<BookCover book={sampleBook} size="thumb" linked={false} />
		<div class="w-36">
			<BookCover book={catalogBooks[2]} size="tile" linked={false} />
		</div>
		<BookCover book={catalogBooks[3]} size="rail" linked={false} />
		<BookCover book={catalogBooks[1]} size="hero" linked={false} />
	</div>
</Story>
