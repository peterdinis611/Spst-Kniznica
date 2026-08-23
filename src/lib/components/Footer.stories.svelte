<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Footer from './Footer.svelte';

	const { Story } = defineMeta({
		title: 'Fond/Footer',
		component: Footer,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Pult" args={{ tone: 'desk' }} />

<Story name="Sieň">
	{#snippet template(args)}
		<div class="landing">
			<Footer {...args} tone="hall" />
		</div>
	{/snippet}
</Story>
