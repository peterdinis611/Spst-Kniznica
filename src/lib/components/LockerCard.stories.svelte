<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LockerCard from './LockerCard.svelte';
	import { catalogBooks, sampleBook } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/LockerCard',
		component: LockerCard,
		tags: ['autodocs']
	});
</script>

<Story name="Jedna" args={{ book: sampleBook }} />

<Story name="Mriežka" asChild>
	<div class="grid w-[36rem] grid-cols-3 gap-6 p-4">
		{#each catalogBooks as book (book.id)}
			<LockerCard {book} />
		{/each}
	</div>
</Story>
