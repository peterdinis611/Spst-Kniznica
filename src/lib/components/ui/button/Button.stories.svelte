<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Button } from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Button',
		component: Button,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	{#snippet template(args)}
		<Button {...args}>Požičať</Button>
	{/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet template(args)}
		<Button {...args}>Katalóg</Button>
	{/snippet}
</Story>

<Story name="Ghost" args={{ variant: 'ghost' }}>
	{#snippet template(args)}
		<Button {...args}>Odhlásiť</Button>
	{/snippet}
</Story>

<Story name="Destructive" args={{ variant: 'destructive' }}>
	{#snippet template(args)}
		<Button {...args}>Zrušiť výpožičku</Button>
	{/snippet}
</Story>
