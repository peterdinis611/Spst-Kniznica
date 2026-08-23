<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StampBurst from './StampBurst.svelte';

	const { Story } = defineMeta({
		title: 'Fond/StampBurst',
		component: StampBurst,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Požičané" args={{ label: 'Požičané', sub: '21 dní' }} />

<Story name="Vrátené" args={{ label: 'Vrátené', sub: 'Pavilón B' }} />
