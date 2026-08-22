<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeToggle from './ThemeToggle.svelte';

	const { Story } = defineMeta({
		title: 'Fond/ThemeToggle',
		component: ThemeToggle,
		tags: ['autodocs']
	});
</script>

<Story name="Desk" args={{ variant: 'desk' }} />

<Story name="Hall" args={{ variant: 'hall' }} />
