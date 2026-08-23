<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Badge } from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Badge',
		component: Badge,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	{#snippet template(args)}
		<Badge {...args}>INF</Badge>
	{/snippet}
</Story>

<Story name="Secondary" args={{ variant: 'secondary' }}>
	{#snippet template(args)}
		<Badge {...args}>Voľná</Badge>
	{/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
	{#snippet template(args)}
		<Badge {...args}>21 dní</Badge>
	{/snippet}
</Story>

<Story name="Destructive" args={{ variant: 'destructive' }}>
	{#snippet template(args)}
		<Badge {...args}>Po lehote</Badge>
	{/snippet}
</Story>

<Story name="Odbory" asChild>
	<div class="flex flex-wrap gap-2">
		<Badge>INF</Badge>
		<Badge variant="secondary">STR</Badge>
		<Badge variant="outline">ELE</Badge>
		<Badge variant="ghost">LIT</Badge>
	</div>
</Story>
