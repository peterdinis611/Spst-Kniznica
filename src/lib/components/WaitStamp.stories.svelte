<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import WaitStamp from './WaitStamp.svelte';

	const { Story } = defineMeta({
		title: 'Fond/WaitStamp',
		component: WaitStamp,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Listujem" args={{ preview: true }} />
