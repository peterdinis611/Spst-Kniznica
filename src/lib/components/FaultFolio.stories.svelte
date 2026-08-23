<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FaultFolio from './FaultFolio.svelte';

	const { Story } = defineMeta({
		title: 'Fond/FaultFolio',
		component: FaultFolio,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Missing" args={{ status: 404 }} />

<Story name="Forbidden" args={{ status: 403 }} />

<Story name="Jammed" args={{ status: 500 }} />

<Story name="Unavailable" args={{ status: 503 }} />
