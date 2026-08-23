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

<Story name="Secondary" args={{ variant: 'secondary' }}>
	{#snippet template(args)}
		<Button {...args}>Zrušiť filter</Button>
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

<Story name="Link" args={{ variant: 'link' }}>
	{#snippet template(args)}
		<Button {...args}>Celý katalóg</Button>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
	{#snippet template(args)}
		<Button {...args}>Obsadené</Button>
	{/snippet}
</Story>

<Story name="Veľkosti" asChild>
	<div class="flex flex-wrap items-center gap-3">
		<Button size="xs">XS</Button>
		<Button size="sm">Malé</Button>
		<Button size="default">Požičať</Button>
		<Button size="lg">Do fondu</Button>
	</div>
</Story>
