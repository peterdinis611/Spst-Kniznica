<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import StampBurst from './StampBurst.svelte';

	const { Story } = defineMeta({
		title: 'Fond/StampBurst',
		component: StampBurst,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' },
		args: { persist: true }
	});
</script>

<Story name="Požičané" args={{ label: 'Požičané', sub: 'do 13. 09. 2026', tone: 'borrowed' }} />

<Story name="Vrátené" args={{ label: 'Vrátené', sub: 'Pavilón B', tone: 'returned' }} />

<Story name="Nevrátené" args={{ label: 'Nevrátené', sub: 'po lehote 4 dni', tone: 'overdue' }} />
